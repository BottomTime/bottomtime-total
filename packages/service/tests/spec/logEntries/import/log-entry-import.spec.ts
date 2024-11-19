import { MethodNotAllowedException } from '@nestjs/common';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Mock } from 'moq.ts';
import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';
import { ZodError } from 'zod';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
  UserEntity,
} from '../../../../src/data';
import { DiveSiteFactory } from '../../../../src/diveSites';
import {
  LogEntry,
  LogEntryFactory,
  LogEntryImport,
} from '../../../../src/logEntries';
import { DefaultImporter } from '../../../../src/logEntries/import/default-importer';
import { UserFactory } from '../../../../src/users';
import { dataSource } from '../../../data-source';
import TestData from '../../../fixtures/import-records.json';
import LogEntryData from '../../../fixtures/log-entries.json';
import { createTestUser } from '../../../utils';

const ImportSessionId = '3d540444-9e2c-4c13-a90a-8b499cd5d3e3';
const OwnerData = createTestUser({
  id: 'acd229a9-b160-4c6f-83c6-f171f9ee11be',
  username: 'testuser',
});
const ImportSession: LogEntryImportEntity = {
  id: ImportSessionId,
  owner: OwnerData,
  date: new Date('2024-11-12T10:07:21-05:00'),
  finalized: new Date('2024-11-12T10:07:48-05:00'),
  device: 'Test Device',
  deviceId: 'Test Device ID',
  bookmark: 'Test Bookmark',
};

dayjs.extend(tz);
dayjs.extend(utc);

describe('Log Entry Import class', () => {
  let Entries: Repository<LogEntryEntity>;
  let EntryAir: Repository<LogEntryAirEntity>;
  let Imports: Repository<LogEntryImportEntity>;
  let ImportRecords: Repository<LogEntryImportRecordEntity>;
  let Users: Repository<UserEntity>;

  let userFactory: UserFactory;
  let entryFactory: LogEntryFactory;
  let logEntryData: LogEntryImportRecordEntity[];

  let logEntryImportData: LogEntryImportEntity;
  let logEntryImport: LogEntryImport;

  beforeAll(() => {
    Entries = dataSource.getRepository(LogEntryEntity);
    EntryAir = dataSource.getRepository(LogEntryAirEntity);
    Imports = dataSource.getRepository(LogEntryImportEntity);
    ImportRecords = dataSource.getRepository(LogEntryImportRecordEntity);
    Users = dataSource.getRepository(UserEntity);
    userFactory = new UserFactory(Users);
    entryFactory = new LogEntryFactory(
      Entries,
      EntryAir,
      new Mock<DiveSiteFactory>().object(),
    );

    logEntryData = LogEntryData.map((data) => ({
      id: uuid(),
      import: ImportSession,
      data: JSON.stringify(data),
    }));
  });

  beforeEach(async () => {
    logEntryImportData = { ...ImportSession };
    logEntryImport = new LogEntryImport(
      dataSource,
      userFactory,
      entryFactory,
      logEntryImportData,
    );
    await Users.save(OwnerData);
  });

  it('will return properties correctly', () => {
    expect(logEntryImport.id).toBe(ImportSessionId);
    expect(logEntryImport.owner.id).toBe(OwnerData.id);
    expect(logEntryImport.date).toEqual(new Date('2024-11-12T10:07:48-05:00'));
    expect(logEntryImport.finalized).toBe(true);
    expect(logEntryImport.device).toBe('Test Device');
    expect(logEntryImport.deviceId).toBe('Test Device ID');
    expect(logEntryImport.bookmark).toBe('Test Bookmark');

    logEntryImportData.finalized = null;
    logEntryImportData.device = null;
    logEntryImportData.deviceId = null;
    logEntryImportData.bookmark = null;

    expect(logEntryImport.finalized).toBe(false);
    expect(logEntryImport.device).toBeUndefined();
    expect(logEntryImport.deviceId).toBeUndefined();
    expect(logEntryImport.bookmark).toBeUndefined();
  });

  it('will return JSON correctly', () => {
    expect(logEntryImport.toJSON()).toEqual({
      id: ImportSessionId,
      owner: 'testuser',
      date: new Date('2024-11-12T10:07:48-05:00'),
      finalized: true,
      device: 'Test Device',
      deviceId: 'Test Device ID',
      bookmark: 'Test Bookmark',
    });
  });

  describe('when canceling an import', () => {
    beforeEach(async () => {
      logEntryImportData.finalized = null;
      await Imports.save(logEntryImportData);
    });

    it('will cancel an import', async () => {
      await expect(logEntryImport.cancel()).resolves.toBe(true);
      expect(logEntryImport.canceled).toBe(true);
      await expect(
        Imports.findOneBy({ id: logEntryImportData.id }),
      ).resolves.toBeNull();
    });

    it('will do nothing if the import has already been canceled', async () => {
      await expect(logEntryImport.cancel()).resolves.toBe(true);
      expect(logEntryImport.canceled).toBe(true);

      await expect(logEntryImport.cancel()).resolves.toBe(false);
      await expect(
        Imports.findOneBy({ id: logEntryImportData.id }),
      ).resolves.toBeNull();
    });

    it('will cancel an import that already has log entries but has not been finalized', async () => {
      await ImportRecords.save(logEntryData.slice(0, 5));
      await expect(logEntryImport.cancel()).resolves.toBe(true);
      expect(logEntryImport.canceled).toBe(true);
      await expect(
        Imports.findOneBy({ id: logEntryImportData.id }),
      ).resolves.toBeNull();
      await expect(ImportRecords.find()).resolves.toHaveLength(0);
    });

    it('will throw an exception if the import has already been finalized', async () => {
      await ImportRecords.save(logEntryData.slice(0, 5));
      await Imports.update(logEntryImportData.id, {
        finalized: ImportSession.finalized,
      });
      logEntryImportData.finalized = ImportSession.finalized;

      await expect(logEntryImport.cancel()).rejects.toThrow(
        MethodNotAllowedException,
      );
    });
  });

  describe('when finalizing an import', () => {
    beforeEach(async () => {
      logEntryImportData.finalized = null;
      await Imports.save(logEntryImportData);
    });

    it('will finalize an import with log entries', async () => {
      await ImportRecords.save(TestData);
      const observer = await logEntryImport.finalize(new DefaultImporter());
      const results = await new Promise<LogEntry[]>((resolve, reject) => {
        const generatedEntries: LogEntry[] = [];
        observer.subscribe({
          next: (entry) => generatedEntries.push(entry),
          error: reject,
          complete: () => resolve(generatedEntries),
        });
      });

      expect(results).toHaveLength(TestData.length);

      const { finalized } = await Imports.findOneByOrFail({
        id: ImportSession.id,
      });
      expect(finalized!.valueOf()).toBeCloseTo(Date.now(), -3);

      const updatedImport = await Imports.findOneByOrFail({
        id: logEntryImport.id,
      });
      expect(updatedImport.finalized).toEqual(logEntryImportData.finalized);

      await expect(
        ImportRecords.existsBy({ import: { id: ImportSession.id } }),
      ).resolves.toBe(false);

      const saved = await Entries.find();
      expect(saved).toHaveLength(TestData.length);

      // TODO: Check that the saved entries match the expected data
    });

    it('will throw an exception if the import does not yet have log entries', async () => {
      const observer = await logEntryImport.finalize(new DefaultImporter());
      await ImportRecords.delete({ import: { id: logEntryImport.id } });
      await expect(
        new Promise<LogEntry[]>((resolve, reject) => {
          const generatedEntries: LogEntry[] = [];
          observer.subscribe({
            next: (entry) => generatedEntries.push(entry),
            error: reject,
            complete: () => resolve(generatedEntries),
          });
        }),
      ).rejects.toThrow(MethodNotAllowedException);

      expect(logEntryImport.finalized).toBe(false);

      const saved = await Imports.findOneByOrFail({ id: logEntryImport.id });
      expect(saved.finalized).toBeNull();
    });

    it('will rollback if the import contains invalid records', async () => {
      await ImportRecords.save(TestData);
      await ImportRecords.save({
        id: 'c8a5ecfa-9a00-414d-a428-0fbc25f525ca',
        import: { id: ImportSession.id } as LogEntryImportEntity,
        data: JSON.stringify({ nope: true }),
      });

      const observer = await logEntryImport.finalize(new DefaultImporter());
      await expect(
        new Promise<LogEntry[]>((resolve, reject) => {
          const generatedEntries: LogEntry[] = [];
          observer.subscribe({
            next: (entry) => generatedEntries.push(entry),
            error: reject,
            complete: () => resolve(generatedEntries),
          });
        }),
      ).rejects.toThrow(ZodError);

      expect(logEntryImport.finalized).toBe(false);

      const saved = await Imports.findOneByOrFail({ id: logEntryImport.id });
      expect(saved.finalized).toBeNull();

      await expect(
        ImportRecords.countBy({ import: { id: ImportSession.id } }),
      ).resolves.toBe(TestData.length + 1);
    });

    it('will throw an exception if the import has been canceled', async () => {
      await logEntryImport.cancel();
      await expect(
        logEntryImport.finalize(new DefaultImporter()),
      ).rejects.toThrow(MethodNotAllowedException);
      expect(logEntryImport.finalized).toBe(false);
      await expect(
        Imports.findOneBy({ id: logEntryImport.id }),
      ).resolves.toBeNull();
    });

    it('will throw exception if the import is already finalized', async () => {
      const finalized = new Date();
      await Imports.update({ id: logEntryImport.id }, { finalized });
      logEntryImportData.finalized = finalized;
      await expect(
        logEntryImport.finalize(new DefaultImporter()),
      ).rejects.toThrow(MethodNotAllowedException);
    });
  });
});
