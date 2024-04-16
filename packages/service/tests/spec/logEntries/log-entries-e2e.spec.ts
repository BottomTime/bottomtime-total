import {
  ListLogEntriesParamsDTO,
  LogEntryDTO,
  LogEntrySortBy,
  SortOrder,
  UserRole,
} from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { Repository } from 'typeorm';

import { LogEntryEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import TestLogEntryData from '../../fixtures/log-entries.json';
import TestUserData from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestUser,
  parseUserJSON,
} from '../../utils';
import { parseLogEntryJSON } from '../../utils/create-test-log-entry';

function getUrl(entryId?: string, username?: string): string {
  let url = `/api/users/${username ?? TestUserData[0].username}/logs`;
  if (entryId) url = `${url}/${entryId}`;
  return url;
}

const AdminUserData: Partial<UserEntity> = {
  id: '562c2abb-e2f5-4745-925b-c9bc936f8972',
  username: 'andy_admin',
  usernameLowered: 'andy_admin',
  email: 'admin@admin.com',
  emailLowered: 'admin@admin.com',
  memberSince: new Date('2024-03-20T13:12:03.449Z'),
  name: 'Andy Admin',
  location: 'Adminland',
  avatar: 'https://admin.com/avatar.jpg',
  role: UserRole.Admin,
};

describe('Log entries E2E tests', () => {
  let app: INestApplication;
  let server: unknown;
  let ownerData: UserEntity[];
  let adminData: UserEntity;
  let logEntryData: LogEntryEntity[];

  let Users: Repository<UserEntity>;
  let Entries: Repository<LogEntryEntity>;

  let authHeader: [string, string];
  let adminAuthHeader: [string, string];
  let otherAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    Users = dataSource.getRepository(UserEntity);
    Entries = dataSource.getRepository(LogEntryEntity);

    adminData = createTestUser(AdminUserData);
    ownerData = TestUserData.slice(0, 4).map((user) => parseUserJSON(user));
    logEntryData = TestLogEntryData.map((entry, i) =>
      parseLogEntryJSON(entry, ownerData[i % ownerData.length]),
    );

    authHeader = await createAuthHeader(ownerData[0].id);
    adminAuthHeader = await createAuthHeader(adminData.id);
    otherAuthHeader = await createAuthHeader(ownerData[1].id);
  });

  beforeEach(async () => {
    await Users.save([...ownerData, AdminUserData]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when retrieving single log entries', () => {
    beforeEach(async () => {
      await Entries.save(logEntryData[0]);
    });

    it('will return the requested log entry', async () => {
      const { body } = await request(server)
        .get(getUrl(logEntryData[0].id))
        .set(...authHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will allow an admin to view any log entry', async () => {
      const { body } = await request(server)
        .get(getUrl(logEntryData[0].id))
        .set(...adminAuthHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(getUrl(logEntryData[0].id)).expect(401);
    });

    it('will return a 403 response if the user is not authorized to view the log entry', async () => {
      await request(server)
        .get(getUrl(logEntryData[0].id))
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the log entry does not exist', async () => {
      await request(server)
        .get(getUrl('308023b5-df12-4e48-88e9-3e8fe88756d3'))
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the target user does not own the log entry', async () => {
      await request(server)
        .get(getUrl(logEntryData[0].id, ownerData[1].username))
        .set(...otherAuthHeader)
        .expect(404);
    });
  });

  describe('when searching log entries', () => {
    beforeEach(async () => {
      await Entries.save(logEntryData);
    });

    it('will perform a basic search for log entries', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .set(...authHeader)
        .expect(200);

      expect(body.totalCount).toBe(75);
      expect(body.logEntries).toHaveLength(50);

      expect(
        body.logEntries.map((entry: LogEntryDTO) => ({
          id: entry.id,
          owner: entry.creator.username,
          entryTime: entry.entryTime,
        })),
      ).toMatchSnapshot();
    });

    it('will allow a search with parameters', async () => {
      const query: ListLogEntriesParamsDTO = {
        query: 'dive',
        startDate: new Date('2023-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-01T00:00:00.000Z'),
        sortBy: LogEntrySortBy.EntryTime,
        sortOrder: SortOrder.Ascending,
        skip: 5,
        limit: 50,
      };

      const { body } = await request(server)
        .get(getUrl())
        .query(query)
        .set(...authHeader)
        .expect(200);

      expect(body.totalCount).toBe(23);
      expect(body.logEntries).toHaveLength(18);

      expect(
        body.logEntries.map((entry: LogEntryDTO) => ({
          id: entry.id,
          owner: entry.creator.username,
          entryTime: entry.entryTime,
        })),
      ).toMatchSnapshot();
    });

    it("will allow admins to search another user's log entries", async () => {
      const { body } = await request(server)
        .get(getUrl())
        .set(...adminAuthHeader)
        .expect(200);

      expect(body.totalCount).toBe(75);
      expect(body.logEntries).toHaveLength(50);

      expect(
        body.logEntries.map((entry: LogEntryDTO) => ({
          id: entry.id,
          owner: entry.creator.username,
          entryTime: entry.entryTime,
        })),
      ).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(getUrl()).expect(401);
    });

    it('will return a 403 response if the user is not authorized to view the log entries', async () => {
      await request(server)
        .get(getUrl())
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      await request(server)
        .get(getUrl(undefined, 'not_a_user'))
        .set(...authHeader)
        .expect(404);
    });
  });
});
