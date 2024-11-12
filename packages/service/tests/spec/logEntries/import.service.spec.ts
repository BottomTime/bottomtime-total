import { Repository } from 'typeorm';
import * as uuid from 'uuid';

import {
  LogEntryEntity,
  LogEntryImportEntity,
  UserEntity,
} from '../../../src/data';
import { LogEntryImport } from '../../../src/logEntries';
import { ImportService } from '../../../src/logEntries/import.service';
import { User } from '../../../src/users';
import { dataSource } from '../../data-source';
import LogEntryData from '../../fixtures/log-entries.json';
import { createTestLogEntryImport, parseLogEntryJSON } from '../../utils';
import { createTestUser } from '../../utils/create-test-user';

jest.mock('uuid');

const Now = new Date('2024-11-12T10:07:21-05:00');
const OwnerData: Partial<UserEntity> = {
  id: '114c1546-216b-4b58-873b-0c63a80fe04e',
  username: 'testuser',
};

describe('Log Entry Import Service', () => {
  let Entries: Repository<LogEntryEntity>;
  let Imports: Repository<LogEntryImportEntity>;
  let Users: Repository<UserEntity>;
  let service: ImportService;

  let ownerData: UserEntity;
  let owner: User;

  beforeAll(() => {
    Entries = dataSource.getRepository(LogEntryEntity);
    Imports = dataSource.getRepository(LogEntryImportEntity);
    Users = dataSource.getRepository(UserEntity);
    service = new ImportService(Imports, Entries);
  });

  beforeEach(async () => {
    jest.useFakeTimers({
      now: Now,
      doNotFake: ['nextTick', 'setImmediate'],
    });

    ownerData = createTestUser(OwnerData);
    owner = new User(Users, ownerData);
    await Users.save(ownerData);
  });

  afterEach(() => {
    jest.useRealTimers();
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

  describe('will retrieve a single import', () => {
    it('will return the requested import', async () => {
      const data = createTestLogEntryImport(ownerData);
      const expected = new LogEntryImport(Imports, Entries, data);
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
    let otherUserData: UserEntity;
    let importData: LogEntryImportEntity[];
    let logEntryData: LogEntryEntity[];

    beforeEach(async () => {
      otherUserData = createTestUser();
      logEntryData = LogEntryData.map((data) =>
        parseLogEntryJSON(data, otherUserData),
      );
      importData = new Array<LogEntryImportEntity>(40);
      for (let i = 0; i < importData.length; i++) {
        importData[i] = createTestLogEntryImport(
          i < 35 ? ownerData : otherUserData,
        );
        for (let j = 0; j < 5; j++) {
          logEntryData[i * 5 + j].owner = importData[i].owner;
          logEntryData[i * 5 + j].import = importData[i];
        }
      }

      await Users.save([ownerData, otherUserData]);
      await Imports.save(importData);
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
      const expected = importData
        .filter((i) => i.owner.id === OwnerData.id && i.finalized === null)
        .sort((a, b) => b.date.valueOf() - a.date.valueOf());

      const results = await service.listImports({
        owner,
        showFinalized: false,
      });

      expect(results.totalCount).toBe(expected.length);
      expect(results.data.map((i) => i.id)).toEqual(expected.map((i) => i.id));
    });

    it('will not return results belonging to a different owner', async () => {
      const results = await service.listImports({
        owner,
        showFinalized: true,
        skip: 0,
        limit: 500,
      });
      results.data.forEach((i) => {
        expect(i.owner).toEqual(ownerData.username);
      });
    });

    it('will return result set with all results matching owner', async () => {
      const expected = importData
        .filter((i) => i.owner.id === ownerData.id)
        .sort(
          (a, b) =>
            (b.finalized?.valueOf() ?? b.date.valueOf()) -
            (a.finalized?.valueOf() ?? a.date.valueOf()),
        );
      const results = await service.listImports({
        owner,
        showFinalized: true,
      });
      expect(results.data).toHaveLength(expected.length);
      expect(results.totalCount).toBe(expected.length);
      expect(results.data.map((i) => i.id)).toEqual(expected.map((i) => i.id));
    });

    it('will return paged results', async () => {
      const expected = importData
        .filter((i) => i.owner.id === OwnerData.id && i.finalized === null)
        .sort((a, b) => a.date.valueOf() - b.date.valueOf())
        .slice(5, 10);
      const results = await service.listImports({
        owner,
        showFinalized: false,
        skip: 5,
        limit: 5,
      });

      expect(results.data).toHaveLength(5);
      expect(results.totalCount).toBe(35);
      expect(results.data.map((i) => i.toEntity().id)).toEqual(
        expected.map((i) => i.id),
      );
    });
  });
});
