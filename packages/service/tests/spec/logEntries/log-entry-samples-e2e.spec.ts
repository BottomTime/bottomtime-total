import { UserRole } from '@bottomtime/api';
import { UsersApiClient } from '@bottomtime/api/dist/client/users';

import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Server } from 'http';
import request from 'supertest';
import { Repository } from 'typeorm';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntrySampleEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSitesModule } from '../../../src/diveSites';
import { LogEntriesService, LogEntryFactory } from '../../../src/logEntries';
import { LogEntrySampleUtils } from '../../../src/logEntries/log-entry-sample-utils';
import { LogEntrySampleController } from '../../../src/logEntries/log-entry-sample.controller';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestSamples from '../../fixtures/dive-profile.json';
import {
  createAuthHeader,
  createTestApp,
  createTestLogEntry,
  createTestUser,
} from '../../utils';

dayjs.extend(utc);
dayjs.extend(timezone);

const OwnerData: Partial<UserEntity> = {
  id: '75f38f46-a229-4160-b479-caa254b07e95',
  username: 'john_c',
};
const LogEntryData: Partial<LogEntryEntity> = {
  id: '75f38f46-a229-4160-b479-caa254b07e95',
};

function getUrl(entryId?: string, username?: string): string {
  return `/api/users/${username || OwnerData.username}/logbook/${
    entryId || LogEntryData.id
  }/samples`;
}

describe('Log Entry Samples E2E', () => {
  let app: INestApplication;
  let server: Server;
  let Users: Repository<UserEntity>;
  let Entries: Repository<LogEntryEntity>;
  let Samples: Repository<LogEntrySampleEntity>;

  let owner: UserEntity;
  let otherUser: UserEntity;
  let admin: UserEntity;

  let logEntry: LogEntryEntity;
  let sampleData: LogEntrySampleEntity[];

  let ownerAuthToken: [string, string];
  let otherUserAuthToken: [string, string];
  let adminAuthToken: [string, string];

  beforeAll(async () => {
    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          LogEntryEntity,
          LogEntryAirEntity,
          LogEntrySampleEntity,
        ]),
        DiveSitesModule,
        UsersModule,
      ],
      providers: [LogEntryFactory, LogEntriesService],
      controllers: [LogEntrySampleController],
    });
    await app.init();
    server = app.getHttpAdapter().getInstance();

    Users = dataSource.getRepository(UserEntity);
    Entries = dataSource.getRepository(LogEntryEntity);
    Samples = dataSource.getRepository(LogEntrySampleEntity);

    owner = createTestUser(OwnerData);
    otherUser = createTestUser();
    admin = createTestUser({ role: UserRole.Admin });
    logEntry = createTestLogEntry(owner, LogEntryData);
    sampleData = TestSamples.map((sample) => {
      return { ...sample, logEntry } as LogEntrySampleEntity;
    });

    [ownerAuthToken, otherUserAuthToken, adminAuthToken] = await Promise.all([
      createAuthHeader(owner.id),
      createAuthHeader(otherUser.id),
      createAuthHeader(admin.id),
    ]);
  });

  beforeEach(async () => {
    await Users.save([owner, otherUser, admin]);
    await Entries.save(logEntry);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing samples for a log entry', () => {
    it('will list samples for a log entry', async () => {
      await Samples.save(sampleData);
      const { body } = await request(server)
        .get(getUrl())
        .set(...ownerAuthToken)
        .expect(200);

      expect(body).toHaveLength(sampleData.length);
      body.slice(0, 20).forEach((sample, index) => {
        const expected = LogEntrySampleUtils.entityToDTO(sampleData[index]);
        expect(sample.depth).toBe(expected.depth);
        expect(sample.offset).toBe(expected.offset);
        expect(sample.temperature).toBe(expected.temperature);
        expect(sample.gps.lat).toBeCloseTo(expected.gps!.lat, -4);
        expect(sample.gps.lng).toBeCloseTo(expected.gps!.lng, -4);
      });
    });

    it('will return an empty array if the log entry does not have any samples', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .set(...ownerAuthToken)
        .expect(200);
      expect(body).toHaveLength(0);
    });

    it("will allow an admin to list samples for another user's log entry", async () => {
      await Samples.save(sampleData);
      const { body } = await request(server)
        .get(getUrl())
        .set(...adminAuthToken)
        .expect(200);

      expect(body).toHaveLength(sampleData.length);
      body.slice(0, 20).forEach((sample, index) => {
        const expected = LogEntrySampleUtils.entityToDTO(sampleData[index]);
        expect(sample.depth).toBe(expected.depth);
        expect(sample.offset).toBe(expected.offset);
        expect(sample.temperature).toBe(expected.temperature);
        expect(sample.gps.lat).toBeCloseTo(expected.gps!.lat, -4);
        expect(sample.gps.lng).toBeCloseTo(expected.gps!.lng, -4);
      });
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(getUrl()).expect(401);
    });

    it('will return a 403 response if the user is not authorized to view the log entry', async () => {
      await request(server)
        .get(getUrl())
        .set(...otherUserAuthToken)
        .expect(403);
    });

    it('will return a 404 response if the log entry does not exist', async () => {
      await request(server)
        .get(getUrl('fba88176-7202-43f5-9b4d-417b27d2452b'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .get(getUrl(undefined, 'jane_doe'))
        .set(...adminAuthToken)
        .expect(404);
    });
  });
});
