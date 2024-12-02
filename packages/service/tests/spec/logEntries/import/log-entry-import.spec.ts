import {
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  DepthUnit,
} from '@bottomtime/api';

import { MethodNotAllowedException } from '@nestjs/common';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Mock } from 'moq.ts';
import { concatMap, from, lastValueFrom, map, range, toArray } from 'rxjs';
import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';
import { ZodError } from 'zod';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
  LogEntrySampleEntity,
  UserEntity,
} from '../../../../src/data';
import { DiveSiteFactory } from '../../../../src/diveSites';
import { LogEntryFactory, LogEntryImport } from '../../../../src/logEntries';
import { LogEntrySampleUtils } from '../../../../src/logEntries/log-entry-sample-utils';
import { UserFactory } from '../../../../src/users';
import { dataSource } from '../../../data-source';
import SampleData from '../../../fixtures/dive-profile.json';
import TestData from '../../../fixtures/import-records.json';
import LogEntryData from '../../../fixtures/log-entries.json';
import { createTestDiveProfile, createTestUser } from '../../../utils';

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
  let EntrySamples: Repository<LogEntrySampleEntity>;
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
    EntrySamples = dataSource.getRepository(LogEntrySampleEntity);
    Imports = dataSource.getRepository(LogEntryImportEntity);
    ImportRecords = dataSource.getRepository(LogEntryImportRecordEntity);
    Users = dataSource.getRepository(UserEntity);
    userFactory = new UserFactory(Users);
    entryFactory = new LogEntryFactory(
      Entries,
      EntryAir,
      EntrySamples,
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

  describe('when requesting or managing records', () => {
    let records: CreateOrUpdateLogEntryParamsDTO[];

    beforeAll(() => {
      records = TestData.map((ir) =>
        CreateOrUpdateLogEntryParamsSchema.parse(JSON.parse(ir.data)),
      );
    });

    beforeEach(async () => {
      logEntryImportData.finalized = null;
      await Imports.save(logEntryImportData);
    });

    it('will return 0 when requesting record count for an import session with no records', async () => {
      await expect(logEntryImport.getRecordCount()).resolves.toBe(0);
    });

    it('will return the correct record count when the import session has records', async () => {
      await ImportRecords.save(TestData);
      await expect(logEntryImport.getRecordCount()).resolves.toBe(
        TestData.length,
      );
    });

    it('will add records to a new import session', async () => {
      const expected = records
        .slice(0, 10)
        .sort((a, b) =>
          b.timing.entryTime.date.localeCompare(a.timing.entryTime.date),
        );

      await logEntryImport.addRecords(expected);

      const saved = await ImportRecords.findBy({
        import: { id: logEntryImport.id },
      });
      expect(saved).toHaveLength(expected.length);
      const actual = saved
        .map((ir) =>
          CreateOrUpdateLogEntryParamsSchema.parse(JSON.parse(ir.data)),
        )
        .sort((a, b) =>
          b.timing.entryTime.date.localeCompare(a.timing.entryTime.date),
        );
      expect(actual).toEqual(expected);
    });

    it('will add records to an import session that already has some', async () => {
      const expected = records
        .slice(0, 30)
        .sort((a, b) =>
          b.timing.entryTime.date.localeCompare(a.timing.entryTime.date),
        );
      await logEntryImport.addRecords(expected.slice(0, 15));
      await logEntryImport.addRecords(expected.slice(15, 30));

      const saved = await ImportRecords.findBy({
        import: { id: logEntryImport.id },
      });
      expect(saved).toHaveLength(expected.length);
      const actual = saved
        .map((ir) =>
          CreateOrUpdateLogEntryParamsSchema.parse(JSON.parse(ir.data)),
        )
        .sort((a, b) =>
          b.timing.entryTime.date.localeCompare(a.timing.entryTime.date),
        );
      expect(actual).toEqual(expected);
    });

    it('will throw an exception when adding records to an import session that has been finalized', async () => {
      logEntryImportData.finalized = new Date();
      await Imports.save(logEntryImportData);
      await expect(logEntryImport.addRecords(records)).rejects.toThrow(
        MethodNotAllowedException,
      );
      await expect(
        ImportRecords.existsBy({ import: { id: logEntryImport.id } }),
      ).resolves.toBe(false);
    });

    it('will throw an exception when adding records to an import session that has been canceled', async () => {
      await logEntryImport.cancel();
      await expect(logEntryImport.addRecords(records)).rejects.toThrow(
        MethodNotAllowedException,
      );
      await expect(
        ImportRecords.existsBy({ import: { id: logEntryImport.id } }),
      ).resolves.toBe(false);
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
      const results = await lastValueFrom(
        logEntryImport.finalize().pipe(toArray()),
      );

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
      saved.forEach((entry) => {
        expect(entry.deviceId).toBe(logEntryImport.deviceId);
        expect(entry.deviceName).toBe(logEntryImport.device);
      });
    });

    it('will import sample data from a dive computer', async () => {
      const importData = [{ ...TestData[0] }, { ...TestData[1] }];
      const parsedData = [
        CreateOrUpdateLogEntryParamsSchema.parse(
          JSON.parse(importData[0].data),
        ),
        CreateOrUpdateLogEntryParamsSchema.parse(
          JSON.parse(importData[1].data),
        ),
      ];

      parsedData[0].depths!.averageDepth = undefined;
      parsedData[0].depths!.maxDepth = undefined;
      parsedData[0].samples = SampleData.map((entity) =>
        LogEntrySampleUtils.entityToDTO(entity as LogEntrySampleEntity),
      );
      importData[0].data = JSON.stringify(parsedData[0]);

      parsedData[1].depths!.averageDepth = undefined;
      parsedData[1].depths!.maxDepth = undefined;
      parsedData[1].samples = SampleData.map((entity) =>
        LogEntrySampleUtils.entityToDTO(entity as LogEntrySampleEntity),
      );
      importData[1].data = JSON.stringify(parsedData[1]);

      await ImportRecords.save(importData);

      const results = await lastValueFrom(
        logEntryImport.finalize().pipe(toArray()),
      );

      expect(results).toHaveLength(2);

      const result = await Entries.findOneByOrFail({ id: results[0].id });
      expect(result.maxDepth).toBe(28.195725329695314);
      expect(result.averageDepth).toBe(14.101892943152182);

      const [samples, count] = await EntrySamples.findAndCount({
        where: { logEntry: { id: results[0].id } },
        order: { timeOffset: 'ASC' },
        take: 100,
      });

      expect(count).toBe(SampleData.length);
      samples.forEach((sample, index) => {
        expect(sample.depth).toEqual(SampleData[index].depth);
        expect(sample.temperature).toEqual(SampleData[index].temperature);
        expect(sample.timeOffset).toEqual(SampleData[index].timeOffset);
      });
    }, 10000);

    it('will throw an exception if the import does not yet have log entries', async () => {
      await ImportRecords.delete({ import: { id: logEntryImport.id } });
      await expect(
        lastValueFrom(logEntryImport.finalize().pipe(toArray())),
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

      await expect(
        lastValueFrom(logEntryImport.finalize().pipe(toArray())),
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
      expect(() => logEntryImport.finalize()).toThrow(
        MethodNotAllowedException,
      );
      expect(logEntryImport.finalized).toBe(false);
      await expect(
        Imports.findOneBy({ id: logEntryImport.id }),
      ).resolves.toBeNull();
    });

    it('will throw exception if the import is already finalized', async () => {
      const finalized = new Date();
      await Imports.update({ id: logEntryImport.id }, { finalized });
      logEntryImportData.finalized = finalized;
      expect(() => logEntryImport.finalize()).toThrow(
        MethodNotAllowedException,
      );
    });

    // This is meant as a bit of a stress test.
    // Feel free to run locally, but running this in CI is not recommended!! 💀
    it.skip('will import a large number of records', async () => {
      const importData = await lastValueFrom(
        range(0, TestData.length).pipe(
          concatMap(() =>
            from(createTestDiveProfile('')).pipe(
              map(LogEntrySampleUtils.entityToDTO),
              toArray(),
            ),
          ),
          map((profile, index) => {
            const parsed = CreateOrUpdateLogEntryParamsSchema.parse(
              JSON.parse(TestData[index].data),
            );
            parsed.depths = { depthUnit: DepthUnit.Meters };
            parsed.depths!.averageDepth = undefined;
            parsed.depths!.maxDepth = undefined;
            parsed.samples = profile;

            const record: LogEntryImportRecordEntity = {
              ...TestData[index],
              import: logEntryImportData,
              data: JSON.stringify(parsed),
            };
            return record;
          }),
          toArray(),
        ),
      );
      await ImportRecords.save(importData);

      const results = await lastValueFrom(
        logEntryImport.finalize().pipe(toArray()),
      );

      expect(results).toHaveLength(TestData.length);

      const result = await Entries.findOneByOrFail({ id: results[0].id });
      expect(result.maxDepth).toBe(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        await EntrySamples.maximum('depth' as any, {
          logEntry: { id: results[0].id },
        }),
      );
      expect(result.averageDepth).toBe(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        await EntrySamples.average('depth' as any, {
          logEntry: { id: results[0].id },
        }),
      );
    }, 60000);
  });
});
