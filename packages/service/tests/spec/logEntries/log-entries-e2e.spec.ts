import {
  CreateOrUpdateLogEntryParamsDTO,
  DepthUnit,
  ListLogEntriesParamsDTO,
  LogEntryDTO,
  LogEntrySortBy,
  SortOrder,
  UserRole,
} from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
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
  let url = `/api/users/${username ?? TestUserData[0].username}/logbook`;
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

dayjs.extend(tz);
dayjs.extend(utc);

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

    it('will return a 400 response if the query parameters are invalid', async () => {
      const {
        body: { details },
      } = await request(server)
        .get(getUrl())
        .set(...authHeader)
        .query({
          query: 'wat??',
          startDate: 'yesterday',
          endDate: 'tomorrow',
          skip: -7,
          limit: 9001,
          sortBy: 'wetness',
          sortOrder: 'backwards',
        })
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 400 response if the start date comes after the end date in the query string', async () => {
      const {
        body: { details },
      } = await request(server)
        .get(getUrl())
        .set(...authHeader)
        .query({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2023-10-02'),
        })
        .expect(400);

      expect(details).toMatchSnapshot();
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

  describe('when creating log entries', () => {
    const newEntry: CreateOrUpdateLogEntryParamsDTO = {
      duration: 58.32,
      bottomTime: 46,
      entryTime: {
        date: '2024-03-20T13:12:00',
        timezone: 'Asia/Tokyo',
      },
      logNumber: 102,
      maxDepth: {
        depth: 28.2,
        unit: DepthUnit.Meters,
      },
      notes: 'I did a dive!',
    };

    it('will create and return a new log entry', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send(newEntry)
        .expect(201);

      expect(body.id).toBeDefined();
      expect(body.creator.username).toBe(ownerData[0].username);
      expect(body.logNumber).toBe(newEntry.logNumber);
      expect(body.entryTime).toEqual(newEntry.entryTime);
      expect(body.bottomTime).toBe(newEntry.bottomTime);
      expect(body.duration).toBe(newEntry.duration);
      expect(body.maxDepth).toEqual(newEntry.maxDepth);
      expect(body.notes).toBe(newEntry.notes);

      const saved = await Entries.findOneOrFail({
        where: { id: body.id },
        relations: ['owner'],
      });
      expect(saved.bottomTime).toBe(newEntry.bottomTime);
      expect(saved.duration).toBe(newEntry.duration);
      expect(saved.entryTime).toEqual(newEntry.entryTime.date);
      expect(saved.timezone).toBe(newEntry.entryTime.timezone);
      expect(saved.timestamp).toEqual(
        dayjs(newEntry.entryTime.date)
          .tz(newEntry.entryTime.timezone, true)
          .toDate(),
      );
      expect(saved.logNumber).toBe(newEntry.logNumber);
      expect(saved.maxDepth).toEqual(newEntry.maxDepth!.depth);
      expect(saved.maxDepthUnit).toBe(newEntry.maxDepth!.unit);
      expect(saved.notes).toBe(newEntry.notes);
    });

    it('will allow admins to create log entries for other users', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send(newEntry)
        .expect(201);

      expect(body.id).toBeDefined();
      expect(body.creator.username).toBe(ownerData[0].username);
      expect(body.logNumber).toBe(newEntry.logNumber);
      expect(body.entryTime).toEqual(newEntry.entryTime);
      expect(body.bottomTime).toBe(newEntry.bottomTime);
      expect(body.duration).toBe(newEntry.duration);
      expect(body.maxDepth).toEqual(newEntry.maxDepth);
      expect(body.notes).toBe(newEntry.notes);

      const saved = await Entries.findOneOrFail({
        where: { id: body.id },
        relations: ['owner'],
      });
      expect(saved.bottomTime).toBe(newEntry.bottomTime);
      expect(saved.duration).toBe(newEntry.duration);
      expect(saved.entryTime).toEqual(newEntry.entryTime.date);
      expect(saved.timezone).toBe(newEntry.entryTime.timezone);
      expect(saved.timestamp).toEqual(
        dayjs(newEntry.entryTime.date)
          .tz(newEntry.entryTime.timezone, true)
          .toDate(),
      );
      expect(saved.logNumber).toBe(newEntry.logNumber);
      expect(saved.maxDepth).toEqual(newEntry.maxDepth!.depth);
      expect(saved.maxDepthUnit).toBe(newEntry.maxDepth!.unit);
      expect(saved.notes).toBe(newEntry.notes);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const {
        body: { details },
      } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({
          duration: 'long',
          bottomTime: true,
          entryTime: {
            date: 'yesterday',
            timezone: 'Arrakis/Arrakeen',
          },
          logNumber: -102,
          maxDepth: {
            depth: -28.2,
            unit: 'fathoms',
          },
          notes: 72,
        })
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing required fields', async () => {
      const {
        body: { details },
      } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({})
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing', async () => {
      const {
        body: { details },
      } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).post(getUrl()).expect(401);
    });

    it('will return a 403 response if the current user is not authorized to create a log entry for the target user', async () => {
      await request(server)
        .post(getUrl())
        .set(...otherAuthHeader)
        .send(newEntry)
        .expect(403);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      await request(server)
        .post(getUrl(undefined, 'not_a_user'))
        .set(...authHeader)
        .send(newEntry)
        .expect(404);
    });
  });

  describe('when deleting log entries', () => {
    let entry: LogEntryEntity;

    beforeAll(() => {
      entry = logEntryData[0];
    });

    beforeEach(async () => {
      await Entries.save(entry);
    });

    it('will delete the requested log entry', async () => {
      await request(server)
        .delete(getUrl(entry.id))
        .set(...authHeader)
        .expect(204);

      const deleted = await Entries.findOneBy({ id: entry.id });
      expect(deleted).toBeNull();
    });

    it('will allow an admin to delete any log entry', async () => {
      await request(server)
        .delete(getUrl(entry.id))
        .set(...adminAuthHeader)
        .expect(204);

      const deleted = await Entries.findOneBy({ id: entry.id });
      expect(deleted).toBeNull();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl(entry.id)).expect(401);
    });

    it('will return a 403 response if the user is not authorized to delete the log entry', async () => {
      await request(server)
        .delete(getUrl(entry.id))
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the log entry does not exist', async () => {
      await request(server)
        .delete(getUrl('308023b5-df12-4e48-88e9-3e8fe88756d3'))
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      await request(server)
        .delete(getUrl(entry.id, 'not_a_user'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when updating an existing log entry', () => {
    const updatedEntry: CreateOrUpdateLogEntryParamsDTO = {
      duration: 58.32,
      bottomTime: 46,
      entryTime: {
        date: '2024-03-20T13:12:00',
        timezone: 'Asia/Tokyo',
      },
      logNumber: 102,
      maxDepth: {
        depth: 28.2,
        unit: DepthUnit.Meters,
      },
      notes: 'I did a dive!',
    };

    let entry: LogEntryEntity;

    beforeAll(() => {
      entry = logEntryData[0];
    });

    beforeEach(async () => {
      await Entries.save(entry);
    });

    it('will update the requested log entry', async () => {
      const { body } = await request(server)
        .put(getUrl(entry.id))
        .set(...authHeader)
        .send(updatedEntry)
        .expect(200);

      expect(body.id).toBe(entry.id);
      expect(body.creator.username).toBe(ownerData[0].username);
      expect(body.logNumber).toBe(updatedEntry.logNumber);
      expect(body.entryTime).toEqual(updatedEntry.entryTime);
      expect(body.bottomTime).toBe(updatedEntry.bottomTime);
      expect(body.duration).toBe(updatedEntry.duration);
      expect(body.maxDepth).toEqual(updatedEntry.maxDepth);
      expect(body.notes).toBe(updatedEntry.notes);

      const saved = await Entries.findOneOrFail({
        where: { id: body.id },
        relations: ['owner'],
      });
      expect(saved.bottomTime).toBe(updatedEntry.bottomTime);
      expect(saved.duration).toBe(updatedEntry.duration);
      expect(saved.entryTime).toEqual(updatedEntry.entryTime.date);
      expect(saved.timezone).toBe(updatedEntry.entryTime.timezone);
      expect(saved.timestamp).toEqual(
        dayjs(updatedEntry.entryTime.date)
          .tz(updatedEntry.entryTime.timezone, true)
          .toDate(),
      );
      expect(saved.logNumber).toBe(updatedEntry.logNumber);
      expect(saved.maxDepth).toEqual(updatedEntry.maxDepth!.depth);
      expect(saved.maxDepthUnit).toBe(updatedEntry.maxDepth!.unit);
      expect(saved.notes).toBe(updatedEntry.notes);
    });

    it('will allow an admin to update any log entry', async () => {
      const { body } = await request(server)
        .put(getUrl(entry.id))
        .set(...adminAuthHeader)
        .send(updatedEntry)
        .expect(200);

      expect(body.id).toBe(entry.id);
      expect(body.creator.username).toBe(ownerData[0].username);
      expect(body.logNumber).toBe(updatedEntry.logNumber);
      expect(body.entryTime).toEqual(updatedEntry.entryTime);
      expect(body.bottomTime).toBe(updatedEntry.bottomTime);
      expect(body.duration).toBe(updatedEntry.duration);
      expect(body.maxDepth).toEqual(updatedEntry.maxDepth);
      expect(body.notes).toBe(updatedEntry.notes);

      const saved = await Entries.findOneOrFail({
        where: { id: body.id },
        relations: ['owner'],
      });
      expect(saved.bottomTime).toBe(updatedEntry.bottomTime);
      expect(saved.duration).toBe(updatedEntry.duration);
      expect(saved.entryTime).toEqual(updatedEntry.entryTime.date);
      expect(saved.timezone).toBe(updatedEntry.entryTime.timezone);
      expect(saved.timestamp).toEqual(
        dayjs(updatedEntry.entryTime.date)
          .tz(updatedEntry.entryTime.timezone, true)
          .toDate(),
      );
      expect(saved.logNumber).toBe(updatedEntry.logNumber);
      expect(saved.maxDepth).toEqual(updatedEntry.maxDepth!.depth);
      expect(saved.maxDepthUnit).toBe(updatedEntry.maxDepth!.unit);
      expect(saved.notes).toBe(updatedEntry.notes);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const {
        body: { details },
      } = await request(server)
        .put(getUrl(entry.id))
        .set(...authHeader)
        .send({
          duration: 'long',
          bottomTime: true,
          entryTime: {
            date: 'yesterday',
            timezone: 'Arrakis/Arrakeen',
          },
          logNumber: -102,
          maxDepth: {
            depth: -28.2,
            unit: 'fathoms',
          },
          notes: 72,
        })
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing required fields', async () => {
      const {
        body: { details },
      } = await request(server)
        .put(getUrl(entry.id))
        .set(...authHeader)
        .send({})
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is missing', async () => {
      const {
        body: { details },
      } = await request(server)
        .put(getUrl(entry.id))
        .set(...authHeader)
        .expect(400);

      expect(details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .put(getUrl(entry.id))
        .send(updatedEntry)
        .expect(401);
    });

    it('will return a 403 response if the current user is not authorized to update the log entry', async () => {
      await request(server)
        .put(getUrl(entry.id))
        .set(...otherAuthHeader)
        .send(updatedEntry)
        .expect(403);
    });

    it('will return a 404 response if the log entry does not exist', async () => {
      await request(server)
        .put(getUrl('308023b5-df12-4e48-88e9-3e8fe88756d3'))
        .set(...authHeader)
        .send(updatedEntry)
        .expect(404);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      await request(server)
        .put(getUrl(entry.id, 'not_a_user'))
        .set(...adminAuthHeader)
        .send(updatedEntry)
        .expect(404);
    });
  });
});
