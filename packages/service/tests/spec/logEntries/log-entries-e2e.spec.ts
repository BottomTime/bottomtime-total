import {
  CreateOrUpdateLogEntryParamsDTO,
  DepthUnit,
  ListLogEntriesParamsDTO,
  LogEntryDTO,
  LogEntrySortBy,
  PressureUnit,
  SortOrder,
  TankMaterial,
  UserRole,
} from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import request from 'supertest';
import { Repository } from 'typeorm';

import {
  DiveSiteEntity,
  LogEntryAirEntity,
  LogEntryEntity,
  UserEntity,
} from '../../../src/data';
import { LogEntryAirUtils } from '../../../src/logEntries/log-entry-air-utils';
import { dataSource } from '../../data-source';
import TestDiveSiteData from '../../fixtures/dive-sites.json';
import TestLogEntryData from '../../fixtures/log-entries.json';
import TestUserData from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestUser,
  parseUserJSON,
} from '../../utils';
import { parseDiveSiteJSON } from '../../utils/create-test-dive-site';
import {
  createTestLogEntry,
  parseLogEntryJSON,
} from '../../utils/create-test-log-entry';

function getUrl(entryId?: string, username?: string): string {
  let url = `/api/users/${username ?? TestUserData[0].username}/logbook`;
  if (entryId) url = `${url}/${entryId}`;
  return url;
}

function getNextLogEntryUrl(username: string): string {
  return `/api/users/${username}/logbook/nextLogEntryNumber`;
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
  let airData: LogEntryAirEntity[];
  let diveSiteData: DiveSiteEntity[];

  let Users: Repository<UserEntity>;
  let Entries: Repository<LogEntryEntity>;
  let EntriesAir: Repository<LogEntryAirEntity>;
  let DiveSites: Repository<DiveSiteEntity>;

  let authHeader: [string, string];
  let adminAuthHeader: [string, string];
  let otherAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    Users = dataSource.getRepository(UserEntity);
    Entries = dataSource.getRepository(LogEntryEntity);
    EntriesAir = dataSource.getRepository(LogEntryAirEntity);
    DiveSites = dataSource.getRepository(DiveSiteEntity);

    adminData = createTestUser(AdminUserData);
    ownerData = TestUserData.slice(0, 4).map((user) => parseUserJSON(user));
    diveSiteData = TestDiveSiteData.map((site, i) =>
      parseDiveSiteJSON(site, ownerData[i % ownerData.length]),
    );
    logEntryData = TestLogEntryData.map((entry, i) =>
      parseLogEntryJSON(
        entry,
        ownerData[i % ownerData.length],
        diveSiteData[i % diveSiteData.length],
      ),
    );

    airData = [];
    for (const entry of logEntryData) {
      if (entry.air) {
        for (let i = 0; i < entry.air.length; i++) {
          airData.push({
            ...entry.air[i],
            logEntry: { id: entry.id } as LogEntryEntity,
          });
        }
      }
    }

    authHeader = await createAuthHeader(ownerData[0].id);
    adminAuthHeader = await createAuthHeader(adminData.id);
    otherAuthHeader = await createAuthHeader(ownerData[1].id);
  });

  beforeEach(async () => {
    await Users.save([...ownerData, AdminUserData]);
    await DiveSites.save(diveSiteData);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when retrieving single log entries', () => {
    let data: LogEntryEntity;

    beforeEach(async () => {
      data = { ...logEntryData[0] };
      await Entries.save(data);
      await EntriesAir.save(
        data.air!.map((tank) => ({
          ...tank,
          logEntry: { id: data.id } as LogEntryEntity,
        })),
      );
    });

    it('will return the requested log entry', async () => {
      const { body } = await request(server)
        .get(getUrl(data.id))
        .set(...authHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will allow an admin to view any log entry', async () => {
      const { body } = await request(server)
        .get(getUrl(data.id))
        .set(...adminAuthHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(getUrl(data.id)).expect(401);
    });

    it('will return a 403 response if the user is not authorized to view the log entry', async () => {
      await request(server)
        .get(getUrl(data.id))
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
        .get(getUrl(data.id, ownerData[1].username))
        .set(...otherAuthHeader)
        .expect(404);
    });
  });

  describe('when searching log entries', () => {
    beforeEach(async () => {
      await Entries.save(logEntryData);
      await EntriesAir.save(airData);
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
          site: entry.site?.name,
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
        limit: 8,
      };

      const { body } = await request(server)
        .get(getUrl())
        .query(query)
        .set(...authHeader)
        .expect(200);

      expect(body.totalCount).toBe(24);
      expect(body.logEntries).toHaveLength(8);

      expect(
        body.logEntries.map((entry: LogEntryDTO) => ({
          id: entry.id,
          owner: entry.creator.username,
          entryTime: entry.entryTime,
          site: entry.site?.name,
          air: entry.air,
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
          site: entry.site?.name,
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
      air: [
        {
          name: 'golden minimalism',
          material: TankMaterial.Steel,
          workingPressure: 207,
          volume: 18,
          count: 2,
          startPressure: 3210,
          endPressure: 1140,
          pressureUnit: PressureUnit.PSI,
          o2Percent: 26.9,
        },
      ],
    };

    it('will create and return a new log entry', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({
          ...newEntry,
          site: diveSiteData[8].id,
        })
        .expect(201);

      expect(body.id).toBeDefined();
      expect(body.creator.username).toBe(ownerData[0].username);
      expect(body.logNumber).toBe(newEntry.logNumber);
      expect(body.entryTime).toEqual(newEntry.entryTime);
      expect(body.bottomTime).toBe(newEntry.bottomTime);
      expect(body.duration).toBe(newEntry.duration);
      expect(body.maxDepth).toEqual(newEntry.maxDepth);
      expect(body.notes).toBe(newEntry.notes);
      expect(body.site.name).toEqual(diveSiteData[8].name);
      expect(body.air).toEqual(newEntry.air);

      const saved = await Entries.findOneOrFail({
        where: { id: body.id },
        relations: ['air', 'owner', 'site'],
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
      expect(saved.site?.name).toEqual(diveSiteData[8].name);
      expect(saved.air).toHaveLength(1);
      expect(saved.air![0].name).toBe(newEntry.air![0].name);
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

    it('will return a 400 response if the site ID cannot be found', async () => {
      const {
        body: { message },
      } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({
          ...newEntry,
          site: '37a214f6-6167-4468-947d-b3171a0425fd',
        })
        .expect(400);

      expect(message).toMatchSnapshot();
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
      entry = { ...logEntryData[0] };
      entry.site = diveSiteData[0];
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
      air: [
        {
          name: 'raw cushion',
          material: TankMaterial.Aluminum,
          workingPressure: 300,
          volume: 4,
          count: 1,
          startPressure: 2940,
          endPressure: 1040,
          pressureUnit: PressureUnit.PSI,
          o2Percent: 28.8,
        },
        {
          name: 'caring poem',
          material: TankMaterial.Steel,
          workingPressure: 300,
          volume: 18,
          count: 1,
          startPressure: 191.41511167166755,
          endPressure: 52.188035525381565,
          pressureUnit: PressureUnit.Bar,
          o2Percent: 39.4,
        },
      ],
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
      expect(body.air).toEqual(updatedEntry.air);

      const saved = await Entries.findOneOrFail({
        where: { id: body.id },
        relations: ['air', 'owner'],
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
      expect(saved.air).toEqual(
        updatedEntry.air?.map((tank, index) => ({
          ...LogEntryAirUtils.dtoToEntity(tank),
          id: saved.air![index].id,
          ordinal: index,
        })),
      );
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

    it('will set site property', async () => {
      await Entries.createQueryBuilder()
        .update(LogEntryEntity)
        .set({ site: null })
        .where({ id: entry.id })
        .execute();
      const { body } = await request(server)
        .put(getUrl(entry.id))
        .set(...adminAuthHeader)
        .send({
          ...updatedEntry,
          site: diveSiteData[11].id,
        })
        .expect(200);

      expect(body.site.name).toBe(diveSiteData[11].name);

      const saved = await Entries.findOneOrFail({
        where: { id: body.id },
        relations: ['owner', 'site'],
      });
      expect(saved.site?.name).toBe(diveSiteData[11].name);
    });

    it('will unset site property', async () => {
      const { body } = await request(server)
        .put(getUrl(entry.id))
        .set(...adminAuthHeader)
        .send({
          ...updatedEntry,
          site: undefined,
        })
        .expect(200);

      expect(body.site).toBeUndefined();

      const saved = await Entries.findOneOrFail({
        where: { id: body.id },
        relations: ['owner', 'site'],
      });
      expect(saved.site).toBeNull();
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

    it('will return a 400 response if the site ID cannot be found', async () => {
      const {
        body: { message },
      } = await request(server)
        .put(getUrl(entry.id))
        .set(...authHeader)
        .send({
          ...updatedEntry,
          site: 'e637a808-90cb-4fba-823e-35cd1898ee4a',
        })
        .expect(400);

      expect(message).toMatchSnapshot();
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

  describe('when querying the next available log number', () => {
    it('will return the next available log number for the user', async () => {
      const owner = ownerData[0];
      const entries = [
        createTestLogEntry(owner, { logNumber: 12 }),
        createTestLogEntry(owner, { logNumber: 56 }),
        createTestLogEntry(owner, { logNumber: 34 }),
        createTestLogEntry(owner, { logNumber: null }),
        createTestLogEntry(owner, { logNumber: 1 }),
        createTestLogEntry(ownerData[1], { logNumber: 999 }),
      ];
      entries[3].logNumber = null;
      await Entries.save(entries);

      const {
        body: { logNumber },
      } = await request(server)
        .get(getNextLogEntryUrl(ownerData[0].username))
        .set(...authHeader)
        .expect(200);

      expect(logNumber).toBe(57);
    });

    it('will return "1" if the user does not have any numbered logs', async () => {
      const {
        body: { logNumber },
      } = await request(server)
        .get(getNextLogEntryUrl(ownerData[0].username))
        .set(...authHeader)
        .expect(200);

      expect(logNumber).toBe(1);
    });

    it('will allow admins to view the next available log number for any user', async () => {
      const owner = ownerData[0];
      const entries = [
        createTestLogEntry(owner, { logNumber: 12 }),
        createTestLogEntry(owner, { logNumber: 56 }),
        createTestLogEntry(owner, { logNumber: 34 }),
        createTestLogEntry(owner, { logNumber: null }),
        createTestLogEntry(owner, { logNumber: 1 }),
        createTestLogEntry(ownerData[1], { logNumber: 999 }),
      ];
      entries[3].logNumber = null;
      await Entries.save(entries);

      const {
        body: { logNumber },
      } = await request(server)
        .get(getNextLogEntryUrl(ownerData[0].username))
        .set(...adminAuthHeader)
        .expect(200);

      expect(logNumber).toBe(57);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .get(getNextLogEntryUrl(ownerData[0].username))
        .expect(401);
    });

    it('will return a 403 response if the user is not authorized to view the next available log number', async () => {
      await request(server)
        .get(getNextLogEntryUrl(ownerData[0].username))
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      await request(server)
        .get(getNextLogEntryUrl('not_a_user'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });
});
