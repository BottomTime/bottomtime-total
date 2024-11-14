import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import * as uuid from 'uuid';

import {
  LogEntryEntity,
  LogEntryImportEntity,
  UserEntity,
} from '../../../../src/data';
import { LogEntryImportFactory } from '../../../../src/logEntries/import/log-entry-import-factory';
import { LogEntryImportService } from '../../../../src/logEntries/import/log-entry-import.service';
import { User, UserFactory } from '../../../../src/users';
import { dataSource } from '../../../data-source';
import LogEntryData from '../../../fixtures/log-entries.json';
import TestData from '../../../fixtures/log-entry-imports.json';
import {
  createTestLogEntryImport,
  parseLogEntryImportJSON,
  parseLogEntryJSON,
} from '../../../utils';
import { createTestUser } from '../../../utils/create-test-user';

jest.mock('uuid');

const Now = new Date('2024-11-12T10:07:21-05:00');
const OwnerData: Partial<UserEntity> = {
  id: '114c1546-216b-4b58-873b-0c63a80fe04e',
  username: 'testuser',
};
const OtherUserData: Partial<UserEntity> = {
  id: '4c5be9b4-782d-45f8-bae1-19dfb120905e',
  username: 'otheruser',
};

describe('Log Entry Import Service', () => {
  let Entries: Repository<LogEntryEntity>;
  let Imports: Repository<LogEntryImportEntity>;
  let Users: Repository<UserEntity>;
  let service: LogEntryImportService;
  let importFactory: LogEntryImportFactory;

  let ownerData: UserEntity;
  let otherUserData: UserEntity;
  let owner: User;
  let testData: LogEntryImportEntity[];

  beforeAll(() => {
    Entries = dataSource.getRepository(LogEntryEntity);
    Imports = dataSource.getRepository(LogEntryImportEntity);
    Users = dataSource.getRepository(UserEntity);

    const userFactory = new UserFactory(Users);
    importFactory = new LogEntryImportFactory(Imports, Entries, userFactory);
    service = new LogEntryImportService(Imports, Entries, importFactory);
  });

  beforeEach(async () => {
    jest.useFakeTimers({
      now: Now,
      doNotFake: ['nextTick', 'setImmediate'],
    });

    ownerData = createTestUser(OwnerData);
    owner = new User(Users, ownerData);
    otherUserData = createTestUser(OtherUserData);
    await Users.save([ownerData, otherUserData]);

    testData = TestData.map((data) =>
      parseLogEntryImportJSON(
        data,
        data.owner.username === ownerData.username ? ownerData : otherUserData,
      ),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.skip('generate test data', async () => {
    const imports = new Array<LogEntryImportEntity>(40);

    for (let i = 0; i < imports.length; i++) {
      const userEntity = i < 35 ? ownerData : otherUserData;
      imports[i] = {
        ...createTestLogEntryImport(i < 35 ? ownerData : otherUserData),
        owner: {
          id: userEntity.id,
          username: userEntity.username,
        } as UserEntity,
      };
    }

    await writeFile(
      resolve(__dirname, '../../fixtures/log-entry-imports.json'),
      JSON.stringify(imports, null, 2),
      'utf-8',
    );
  });

  describe('when initializing a new import', () => {
    it('will initialize a new import with minimal params and return it', async () => {
      const id = '5f207df6-5370-4dc5-baa2-2eb60bbfd9d0';
      jest.spyOn(uuid, 'v7').mockReturnValue(id);
      const result = await service.createImport(owner);
      expect(result.toJSON()).toEqual({
        id,
        owner: owner.username,
        date: Now,
        finalized: false,
      });

      const saved = await Imports.findOneOrFail({
        where: { id },
        relations: ['owner'],
      });
      expect(saved.owner.id).toEqual(owner.id);
      expect(saved.finalized).toBeNull();
      expect(saved.date).toEqual(Now);
      expect(saved.device).toBeNull();
      expect(saved.deviceId).toBeNull();
      expect(saved.bookmark).toBeNull();
    });

    it('will initialize a new import with all params and return it', async () => {
      const id = '27bcdbae-a2bb-4cee-a15e-9199a8874f81';
      const device = 'Suunto Kajigger';
      const deviceId = '1234567890';
      const bookmark = 'bookmark_xyz123';

      jest.spyOn(uuid, 'v7').mockReturnValue(id);
      const result = await service.createImport(owner, {
        device,
        deviceId,
        bookmark,
      });
      expect(result.toJSON()).toEqual({
        id,
        owner: owner.username,
        date: Now,
        finalized: false,
        device,
        deviceId,
        bookmark,
      });

      const saved = await Imports.findOneOrFail({
        where: { id },
        relations: ['owner'],
      });
      expect(saved.owner.id).toEqual(owner.id);
      expect(saved.finalized).toBeNull();
      expect(saved.date).toEqual(Now);
      expect(saved.device).toEqual(device);
      expect(saved.deviceId).toEqual(deviceId);
      expect(saved.bookmark).toEqual(bookmark);
    });
  });

  describe('when retrieving a single import', () => {
    it('will return the requested import', async () => {
      const data = createTestLogEntryImport(ownerData);
      const expected = importFactory.createImport(data);
      await Imports.save(data);

      const actual = await service.getImport(data.id);
      expect(actual?.toJSON()).toEqual(expected.toJSON());
    });

    it('will return undefined if the indicated import does not exist', async () => {
      await expect(
        service.getImport('ce41d20d-8eaa-4eb6-b60f-2afdf1ac8779'),
      ).resolves.toBeUndefined();
    });
  });

  describe('when listing imports', () => {
    let logEntryData: LogEntryEntity[];

    beforeEach(async () => {
      logEntryData = LogEntryData.map((data) =>
        parseLogEntryJSON(data, otherUserData),
      );
      for (let i = 0; i < testData.length; i++) {
        for (let j = 0; j < 5; j++) {
          logEntryData[i * 5 + j].owner = testData[i].owner;
          logEntryData[i * 5 + j].import = testData[i];
        }
      }

      await Users.save([ownerData, otherUserData]);
      await Imports.save(testData);
      await Entries.save(logEntryData);
    });

    it('will return an empty set if no imports match the criteria', async () => {
      const someOtherUser = new User(Users, createTestUser());
      const results = await service.listImports({
        owner: someOtherUser,
      });

      expect(results).toEqual({
        data: [],
        totalCount: 0,
      });
    });

    it('will return result set with finalized imports filtered out', async () => {
      const expectedLength = testData.filter(
        (i) => i.owner.id === OwnerData.id && i.finalized === null,
      ).length;

      const results = await service.listImports({
        owner,
        showFinalized: false,
      });

      expect(results.totalCount).toBe(expectedLength);
      expect(
        results.data.map((i) => ({
          owner: i.owner.username,
          date: i.date,
          finalized: i.finalized,
        })),
      ).toMatchSnapshot();
    });

    it('will not return results belonging to a different owner', async () => {
      const results = await service.listImports({
        owner,
        showFinalized: true,
        skip: 0,
        limit: 500,
      });
      expect(results.data.every((i) => i.owner.id === ownerData.id)).toBe(true);
    });

    it('will return result set with all results matching owner', async () => {
      const expectedLength = testData.filter(
        (i) => i.owner.id === ownerData.id,
      ).length;
      const results = await service.listImports({
        owner,
        showFinalized: true,
      });
      expect(results.data).toHaveLength(expectedLength);
      expect(results.totalCount).toBe(expectedLength);
      expect(
        results.data.map((i) => ({
          owner: i.owner.username,
          date: i.date,
          finalized: i.finalized,
        })),
      ).toMatchSnapshot();
    });

    it('will return paged results', async () => {
      const results = await service.listImports({
        owner,
        showFinalized: true,
        skip: 5,
        limit: 5,
      });

      expect(results.data).toHaveLength(5);
      expect(results.totalCount).toBe(35);
      expect(
        results.data.map((i) => ({
          owner: i.owner.username,
          date: i.date,
          finalized: i.finalized,
        })),
      ).toMatchSnapshot();
    });
  });

  describe('when expiring imports', () => {
    beforeEach(async () => {
      await Imports.save(testData);
    });

    it('will expire all non-finalized imports older than the indicated date', async () => {
      const expired = testData
        .filter((i) => i.finalized === null)
        .sort((a, b) => b.date.valueOf() - a.date.valueOf());
      const expiration = expired[expired.length - 3].date;
      const removed = await service.expireImports(expiration);
      expect(removed).toBe(expired.length - 4);

      await expect(Imports.count()).resolves.toBe(testData.length - removed);
      await expect(
        Imports.existsBy({
          finalized: IsNull(),
          date: LessThanOrEqual(expiration),
        }),
      ).resolves.toBe(false);
    });
  });
});
