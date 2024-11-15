import { MethodNotAllowedException } from '@nestjs/common';

import { Mock } from 'moq.ts';
import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import {
  LogEntryEntity,
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
  UserEntity,
} from '../../../../src/data';
import { LogEntriesService, LogEntryImport } from '../../../../src/logEntries';
import { UserFactory } from '../../../../src/users';
import { dataSource } from '../../../data-source';
import LogEntryData from '../../../fixtures/log-entries.json';
import { createTestUser } from '../../../utils';

const OwnerData = createTestUser({
  id: 'acd229a9-b160-4c6f-83c6-f171f9ee11be',
  username: 'testuser',
});
const TestData: LogEntryImportEntity = {
  id: '8c6613e6-a7b8-446b-b07d-3ddc81757337',
  owner: OwnerData,
  date: new Date('2024-11-12T10:07:21-05:00'),
  finalized: new Date('2024-11-12T10:07:48-05:00'),
  device: 'Test Device',
  deviceId: 'Test Device ID',
  bookmark: 'Test Bookmark',
};

describe('Log Entry Import class', () => {
  let Imports: Repository<LogEntryImportEntity>;
  let ImportRecords: Repository<LogEntryImportRecordEntity>;
  let entries: LogEntriesService;

  let Users: Repository<UserEntity>;
  let userFactory: UserFactory;
  let logEntryData: LogEntryImportRecordEntity[];

  let logEntryImportData: LogEntryImportEntity;
  let logEntryImport: LogEntryImport;

  beforeAll(() => {
    Imports = dataSource.getRepository(LogEntryImportEntity);
    ImportRecords = dataSource.getRepository(LogEntryImportRecordEntity);
    Users = dataSource.getRepository(UserEntity);
    userFactory = new UserFactory(Users);
    entries = new Mock<LogEntriesService>().object();

    logEntryData = LogEntryData.map((data) => ({
      id: uuid(),
      import: TestData,
      data: JSON.stringify(data),
    }));
  });

  beforeEach(async () => {
    logEntryImportData = { ...TestData };
    logEntryImport = new LogEntryImport(
      Imports,
      ImportRecords,
      entries,
      userFactory,
      logEntryImportData,
    );
    await Users.save(OwnerData);
  });

  it('will return properties correctly', () => {
    expect(logEntryImport.id).toBe('8c6613e6-a7b8-446b-b07d-3ddc81757337');
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
      id: '8c6613e6-a7b8-446b-b07d-3ddc81757337',
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
        finalized: TestData.finalized,
      });
      logEntryImportData.finalized = TestData.finalized;

      await expect(logEntryImport.cancel()).rejects.toThrow(
        MethodNotAllowedException,
      );
    });
  });

  describe('when finalizing an import', () => {
    beforeEach(async () => {
      logEntryImportData.finalized = null;
      await Imports.save(logEntryImportData);
      await ImportRecords.save(logEntryData.slice(0, 5));
    });

    it('will finalize an import with log entries', async () => {
      await expect(logEntryImport.finalize()).resolves.toBe(true);
      expect(logEntryImport.finalized).toBe(true);
      expect(logEntryImportData.finalized?.valueOf()).toBeCloseTo(
        Date.now(),
        -3,
      );

      const saved = await Imports.findOneByOrFail({ id: logEntryImport.id });
      expect(saved.finalized).toEqual(logEntryImportData.finalized);
    });

    it('will throw an exception if the import does not yet have log entries', async () => {
      await ImportRecords.delete({ import: { id: logEntryImport.id } });
      await expect(logEntryImport.finalize()).rejects.toThrow(
        MethodNotAllowedException,
      );
      expect(logEntryImport.finalized).toBe(false);
    });

    it('will throw an exception if the import has been canceled', async () => {
      await logEntryImport.cancel();
      await expect(logEntryImport.finalize()).rejects.toThrow(
        MethodNotAllowedException,
      );
      expect(logEntryImport.finalized).toBe(false);
      await expect(
        Imports.findOneBy({ id: logEntryImport.id }),
      ).resolves.toBeNull();
    });

    it('will do nothing if the import is already finalized', async () => {
      const finalized = new Date();
      await Imports.update({ id: logEntryImport.id }, { finalized });
      logEntryImportData.finalized = finalized;
      await expect(logEntryImport.finalize()).resolves.toBe(false);
      expect(logEntryImport.finalized).toBe(true);
    });
  });
});
