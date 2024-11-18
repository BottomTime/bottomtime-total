import {
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  LogEntryDTO,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { writeFile } from 'fs/promises';
import { Mock } from 'moq.ts';
import { resolve } from 'path';
import { from } from 'rxjs';
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
import { DefaultImporter } from '../../../../src/logEntries/import/default-importer';
import { LogEntryFactory } from '../../../../src/logEntries/log-entry-factory';
import { User } from '../../../../src/users';
import { dataSource } from '../../../data-source';
import TestData from '../../../fixtures/import-records.json';
import { createTestLogEntry, createTestUser } from '../../../utils';

const OwnerData: Partial<UserEntity> = {
  id: 'a0918549-d67f-434b-a7eb-58ab950b5f6e',
  username: 'testuser',
};
const ImportSession: LogEntryImportEntity = {
  bookmark: 'abcd1234',
  date: new Date('2024-11-18T08:39:16-05:00'),
  device: 'Shearwater Terik',
  deviceId: '123456',
  finalized: null,
  id: '3d540444-9e2c-4c13-a90a-8b499cd5d3e3',
  owner: { id: OwnerData.id } as UserEntity,
};

function toRecordString(
  entry: LogEntryEntity,
  entryFactory: LogEntryFactory,
): string {
  const obj = CreateOrUpdateLogEntryParamsSchema.parse(
    entryFactory.createLogEntry(entry).toJSON(),
  );
  return JSON.stringify(obj);
}

dayjs.extend(timezone);
dayjs.extend(utc);

function compare(
  actual: LogEntryDTO,
  expected: LogEntryDTO | CreateOrUpdateLogEntryParamsDTO,
) {
  expect(actual.timing).toEqual(expected.timing);
  expect(actual.conditions).toEqual(expected.conditions);
  expect(actual.creator.userId).toEqual(OwnerData.id);
  expect(actual.depths).toEqual(expected.depths);
  expect(actual.equipment).toEqual(expected.equipment);
  expect(actual.air?.sort((a, b) => a.name.localeCompare(b.name))).toEqual(
    expected.air?.sort((a, b) => a.name.localeCompare(b.name)),
  );
  expect(actual.id).toHaveLength(36);
  expect(actual.logNumber).toEqual(expected.logNumber);
  expect(actual.notes).toEqual(expected.notes);
  expect(actual.samples).toEqual(expected.samples);
  expect(actual.tags).toEqual(expected.tags);
}

describe('Default Importer', () => {
  let Entries: Repository<LogEntryEntity>;
  let EntryAir: Repository<LogEntryAirEntity>;
  let Imports: Repository<LogEntryImportEntity>;
  let ImportRecords: Repository<LogEntryImportRecordEntity>;
  let Users: Repository<UserEntity>;
  let entryFactory: LogEntryFactory;

  let importer: DefaultImporter;

  let owner: UserEntity;
  let entries: LogEntryEntity[];

  beforeAll(() => {
    Entries = dataSource.getRepository(LogEntryEntity);
    EntryAir = dataSource.getRepository(LogEntryAirEntity);
    Imports = dataSource.getRepository(LogEntryImportEntity);
    ImportRecords = dataSource.getRepository(LogEntryImportRecordEntity);
    Users = dataSource.getRepository(UserEntity);

    const siteFactory = new Mock<DiveSiteFactory>().object();
    entryFactory = new LogEntryFactory(Entries, EntryAir, siteFactory);
    importer = new DefaultImporter(entryFactory);

    owner = createTestUser(OwnerData);
    entries = new Array<LogEntryEntity>(200);
    for (let i = 0; i < entries.length; i++) {
      entries[i] = createTestLogEntry(owner);
    }
  });

  beforeEach(async () => {
    await Users.save(owner);
    await Imports.save(ImportSession);
  });

  it.skip('will generate some test data', async () => {
    const importRecords = new Array<LogEntryImportRecordEntity>(entries.length);
    for (let i = 0; i < importRecords.length; i++) {
      importRecords[i] = {
        data: toRecordString(entries[i], entryFactory),
        id: uuid(),
        import: { id: ImportSession.id } as LogEntryImportEntity,
      };
    }

    await writeFile(
      resolve(__dirname, '../../../fixtures/import-records.json'),
      JSON.stringify(importRecords, null, 2),
      'utf-8',
    );
  });

  it('will perform an import operation', async () => {
    const expected = TestData.map((r) =>
      CreateOrUpdateLogEntryParamsSchema.parse(JSON.parse(r.data)),
    );
    await ImportRecords.save(TestData);

    const results = await new Promise<LogEntryEntity[]>((resolve, reject) => {
      const entries: LogEntryEntity[] = [];
      importer
        .import({
          owner: new User(Users, owner),
          device: ImportSession.device!,
          deviceId: ImportSession.deviceId!,
          data: from(TestData.map((r) => r.data)),
        })
        .subscribe({
          next: (entry) => entries.push(entry),
          error: reject,
          complete: () => resolve(entries),
        });
    });

    expect(results).toHaveLength(TestData.length);
    results
      .map((entry) => entryFactory.createLogEntry(entry).toJSON())
      .forEach((actual, index) => {
        compare(actual, expected[index]);
      });
  });

  it('will report failures in the records', async () => {
    await expect(
      new Promise<void>((resolve, reject) => {
        importer
          .import({
            owner: new User(Users, owner),
            data: from(['{not valid json!']),
          })
          .subscribe({
            error: (error) => {
              reject(error);
            },
            complete: () => {
              resolve();
            },
          });
      }),
    ).rejects.toThrow(SyntaxError);

    await expect(
      new Promise<void>((resolve, reject) => {
        importer
          .import({
            owner: new User(Users, owner),
            data: from(['{"wat": "lol"}']),
          })
          .subscribe({
            error: (error) => {
              reject(error);
            },
            complete: () => {
              resolve();
            },
          });
      }),
    ).rejects.toThrow(ZodError);
  });
});
