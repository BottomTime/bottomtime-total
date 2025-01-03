import { LogEntrySampleDTO, UserRole } from '@bottomtime/api';

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
import { OperatorsModule } from '../../../src/operators';
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
        OperatorsModule,
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
      body.slice(0, 20).forEach((sample: LogEntrySampleDTO, index: number) => {
        const expected = LogEntrySampleUtils.entityToDTO(sampleData[index]);
        expect(sample.depth).toBe(expected.depth);
        expect(sample.offset).toBe(expected.offset);
        expect(sample.temperature).toBe(expected.temperature);
        expect(sample.gps?.lat).toBeCloseTo(expected.gps!.lat, -4);
        expect(sample.gps?.lng).toBeCloseTo(expected.gps!.lng, -4);
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
      body.slice(0, 20).forEach((sample: LogEntrySampleDTO, index: number) => {
        const expected = LogEntrySampleUtils.entityToDTO(sampleData[index]);
        expect(sample.depth).toBe(expected.depth);
        expect(sample.offset).toBe(expected.offset);
        expect(sample.temperature).toBe(expected.temperature);
        expect(sample.gps?.lat).toBeCloseTo(expected.gps!.lat, -4);
        expect(sample.gps?.lng).toBeCloseTo(expected.gps!.lng, -4);
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

  describe('when adding samples to a log entry', () => {
    const BasicSample: LogEntrySampleDTO = {
      depth: 20,
      offset: 0,
      gps: { lat: 0, lng: 0 },
      temperature: 18,
    };

    it('will add new samples to the log entry', async () => {
      const samples = sampleData
        .slice(0, 20)
        .map(LogEntrySampleUtils.entityToDTO);

      await request(server)
        .post(getUrl())
        .set(...ownerAuthToken)
        .send(samples.slice(0, 10))
        .expect(201);
      const { body } = await request(server)
        .post(getUrl())
        .set(...ownerAuthToken)
        .send(samples.slice(10, 20))
        .expect(201);

      const saved = await Samples.find({
        where: { logEntry: { id: logEntry.id } },
        order: { timeOffset: 'ASC' },
      });

      expect(saved).toHaveLength(samples.length);
      saved.forEach((sample, index) => {
        const expected = samples[index];
        expect(sample.depth).toBe(expected.depth);
        expect(sample.timeOffset).toBe(expected.offset);
        expect(sample.temperature).toBe(expected.temperature);
        expect(sample.gps!.coordinates[1]).toBeCloseTo(expected.gps!.lat, -4);
        expect(sample.gps!.coordinates[0]).toBeCloseTo(expected.gps!.lng, -4);
      });

      expect(body).toEqual({
        addedRecords: 10,
        totalRecords: 20,
      });
    });

    it('will handle a large number of samples', async () => {
      await request(server)
        .post(getUrl())
        .set(...ownerAuthToken)
        .send(sampleData.slice(0, 500).map(LogEntrySampleUtils.entityToDTO))
        .expect(201);

      await expect(
        Samples.countBy({ logEntry: { id: logEntry.id } }),
      ).resolves.toBe(500);
    });

    it("will allow an admin to add samples to another user's log entry", async () => {
      const samples = sampleData
        .slice(0, 10)
        .map(LogEntrySampleUtils.entityToDTO);

      await request(server)
        .post(getUrl())
        .set(...adminAuthToken)
        .send(samples)
        .expect(201);

      const saved = await Samples.find({
        where: { logEntry: { id: logEntry.id } },
        order: { timeOffset: 'ASC' },
      });

      expect(saved).toHaveLength(samples.length);
      saved.forEach((sample, index) => {
        const expected = samples[index];
        expect(sample.depth).toBe(expected.depth);
        expect(sample.timeOffset).toBe(expected.offset);
        expect(sample.temperature).toBe(expected.temperature);
        expect(sample.gps!.coordinates[1]).toBeCloseTo(expected.gps!.lat, -4);
        expect(sample.gps!.coordinates[0]).toBeCloseTo(expected.gps!.lng, -4);
      });
    });

    it('will return a 400 response if the request body is empty', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...ownerAuthToken)
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...ownerAuthToken)
        .send({ valid: 'nope' })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body array does not contain any elements', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...ownerAuthToken)
        .send([])
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).post(getUrl()).send([BasicSample]).expect(401);
    });

    it('will return a 403 response if the user is not authorized to add samples to the log entry', async () => {
      await request(server)
        .post(getUrl())
        .set(...otherUserAuthToken)
        .send([BasicSample])
        .expect(403);
    });

    it('will return a 404 response if the log entry does not exist', async () => {
      await request(server)
        .post(getUrl('4df12282-0741-429d-8935-e8dbaa562d90'))
        .set(...adminAuthToken)
        .send([BasicSample])
        .expect(404);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .post(getUrl(undefined, 'jane_doe'))
        .set(...adminAuthToken)
        .send([BasicSample])
        .expect(404);
    });

    it('will return a 409 response if the log entry already has samples with conflicting offsets', async () => {
      const samples = sampleData
        .slice(10, 15)
        .map(LogEntrySampleUtils.entityToDTO);

      await Samples.save(sampleData.slice(0, 20));
      const { body } = await request(server)
        .post(getUrl())
        .set(...ownerAuthToken)
        .send(samples)
        .expect(409);

      expect(body.details).toMatchSnapshot();
    });
  });

  describe('when clearing data', () => {
    it('will clear all samples for a log entry', async () => {
      await Samples.save(sampleData);
      await request(server)
        .delete(getUrl())
        .set(...ownerAuthToken)
        .expect(204);

      await expect(
        Samples.existsBy({ logEntry: { id: logEntry.id } }),
      ).resolves.toBe(false);
    });

    it('will do nothing if the log entry does not have any samples', async () => {
      await request(server)
        .delete(getUrl())
        .set(...ownerAuthToken)
        .expect(204);
    });

    it('will allow an admin to clear samples for another user', async () => {
      await Samples.save(sampleData.slice(0, 10));
      await request(server)
        .delete(getUrl())
        .set(...adminAuthToken)
        .expect(204);

      await expect(
        Samples.existsBy({ logEntry: { id: logEntry.id } }),
      ).resolves.toBe(false);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl()).expect(401);
    });

    it('will return a 403 response if the user is not authorized to clear samples', async () => {
      await request(server)
        .delete(getUrl())
        .set(...otherUserAuthToken)
        .expect(403);
    });

    it('will return a 404 response if the log entry does not exist', async () => {
      await request(server)
        .delete(getUrl('6f3d3103-bb50-4e63-85d3-cc8cd969e6c2'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .delete(getUrl(undefined, 'jane_doe'))
        .set(...adminAuthToken)
        .expect(404);
    });
  });
});
