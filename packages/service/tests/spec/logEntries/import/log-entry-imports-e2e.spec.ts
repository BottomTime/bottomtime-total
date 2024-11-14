import { CreateLogsImportParamsDTO, UserRole } from '@bottomtime/api';
import { LogImportFeature } from '@bottomtime/common';

import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Server } from 'http';
import request from 'supertest';
import { Repository } from 'typeorm';

import {
  LogEntryEntity,
  LogEntryImportEntity,
  UserEntity,
} from '../../../../src/data';
import { ConfigCatClient } from '../../../../src/dependencies';
import { FeaturesModule } from '../../../../src/features';
import { LogEntryImportFactory } from '../../../../src/logEntries/import/log-entry-import-factory';
import { LogEntryImportService } from '../../../../src/logEntries/import/log-entry-import.service';
import { LogEntryImportsController } from '../../../../src/logEntries/import/log-entry-imports.controller';
import { UsersModule } from '../../../../src/users';
import { dataSource } from '../../../data-source';
import TestData from '../../../fixtures/log-entry-imports.json';
import {
  ConfigCatClientMock,
  createAuthHeader,
  createTestApp,
  createTestUser,
  parseLogEntryImportJSON,
} from '../../../utils';

const OwnerData: Partial<UserEntity> = {
  id: '6e23d9d9-513c-4319-a489-918d77739a4d',
  username: 'testuser',
};
const OtherUserData: Partial<UserEntity> = {
  id: '5e875892-7f39-4b29-8ff4-89fdb8f07567',
  username: 'other_guy23',
};

function getUrl(username?: string) {
  return `/api/users/${username || OwnerData.username}/logImports`;
}

describe('Import log entries E2E tests', () => {
  let app: INestApplication;
  let server: Server;
  let Users: Repository<UserEntity>;
  let Imports: Repository<LogEntryImportEntity>;
  let configCatClient: ConfigCatClientMock;

  let owner: UserEntity;
  let otherUser: UserEntity;
  let admin: UserEntity;
  let ownerAuthToken: [string, string];
  let otherUserAuthToken: [string, string];
  let adminAuthToken: [string, string];

  beforeAll(async () => {
    configCatClient = new ConfigCatClientMock();
    app = await createTestApp(
      {
        imports: [
          TypeOrmModule.forFeature([
            UserEntity,
            LogEntryEntity,
            LogEntryImportEntity,
          ]),
          FeaturesModule,
          UsersModule,
        ],
        providers: [LogEntryImportService, LogEntryImportFactory],
        controllers: [LogEntryImportsController],
      },
      {
        provide: ConfigCatClient,
        use: configCatClient,
      },
    );
    await app.init();
    server = app.getHttpAdapter().getInstance();

    Users = dataSource.getRepository(UserEntity);
    Imports = dataSource.getRepository(LogEntryImportEntity);

    owner = createTestUser(OwnerData);
    otherUser = createTestUser(OtherUserData);
    admin = createTestUser({ role: UserRole.Admin });
    [ownerAuthToken, otherUserAuthToken, adminAuthToken] = await Promise.all([
      createAuthHeader(owner.id),
      createAuthHeader(otherUser.id),
      createAuthHeader(admin.id),
    ]);
  });

  beforeEach(async () => {
    await Users.save([owner, otherUser, admin]);
    configCatClient.flags[LogImportFeature.key] = true;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when initializing a new import session', () => {
    it('will initiate a session and return the result', async () => {
      const options: CreateLogsImportParamsDTO = {
        device: 'Shearwater Perdix 2 Ti',
        deviceId: '1234567890',
        bookmark: 'Test bookmark',
      };
      const { body } = await request(server)
        .post(getUrl())
        .set(...ownerAuthToken)
        .send(options)
        .expect(201);

      expect(body.id).toBeDefined();
      expect(new Date(body.date).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(body.owner).toBe(owner.username);
      expect(body.finalized).toBe(false);
      expect(body.deviceId).toBe(options.deviceId);
      expect(body.device).toBe(options.device);
      expect(body.bookmark).toBe(options.bookmark);

      const importData = await Imports.findOneByOrFail({ id: body.id });
      expect(importData.deviceId).toBe(options.deviceId);
      expect(importData.device).toBe(options.device);
      expect(importData.bookmark).toBe(options.bookmark);
    });

    it("will allow admins to import into any user's logbook", async () => {
      const options: CreateLogsImportParamsDTO = {
        device: 'Shearwater Perdix 2 Ti',
        deviceId: '1234567890',
        bookmark: 'Test bookmark',
      };
      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthToken)
        .send(options)
        .expect(201);

      expect(body.id).toBeDefined();
      expect(new Date(body.date).valueOf()).toBeCloseTo(Date.now(), -3);
      expect(body.owner).toBe(owner.username);
      expect(body.finalized).toBe(false);
      expect(body.deviceId).toBe(options.deviceId);
      expect(body.device).toBe(options.device);
      expect(body.bookmark).toBe(options.bookmark);

      const importData = await Imports.findOneByOrFail({ id: body.id });
      expect(importData.deviceId).toBe(options.deviceId);
      expect(importData.device).toBe(options.device);
      expect(importData.bookmark).toBe(options.bookmark);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...ownerAuthToken)
        .send({
          device: 3,
          deviceId: true,
        })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).post(getUrl()).expect(401);
    });

    it('will return a 403 response if the user is not authorized to import into the target logbook', async () => {
      const options: CreateLogsImportParamsDTO = {
        device: 'Shearwater Perdix 2 Ti',
        deviceId: '1234567890',
        bookmark: 'Test bookmark',
      };
      await request(server)
        .post(getUrl())
        .set(...otherUserAuthToken)
        .send(options)
        .expect(403);
    });

    it('will return a 404 response if the target user is not found', async () => {
      const options: CreateLogsImportParamsDTO = {
        device: 'Shearwater Perdix 2 Ti',
        deviceId: '1234567890',
        bookmark: 'Test bookmark',
      };
      await request(server)
        .post(getUrl('the_dude'))
        .set(...otherUserAuthToken)
        .send(options)
        .expect(404);
    });

    it('will return a 501 response if the feature flag has not been enabled', async () => {
      configCatClient.flags[LogImportFeature.key] = false;

      await request(server)
        .post(getUrl())
        .set(...ownerAuthToken)
        .expect(501);
    });
  });

  describe('when listing import sessions', () => {
    let testData: LogEntryImportEntity[];

    beforeAll(() => {
      testData = TestData.map((i, index) =>
        parseLogEntryImportJSON(i, index < 35 ? owner : otherUser),
      );
    });

    it('will retrieve a list of import sessions for the target user', async () => {
      await Imports.save(testData);
      const { body } = await request(server)
        .get(getUrl())
        .query({
          showFinalized: false,
        })
        .set(...ownerAuthToken)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will allow an administrator to retrieve a list of import sessions for any user', async () => {
      await Imports.save(testData);
      const { body } = await request(server)
        .get(getUrl(otherUser.username))
        .query({
          showFinalized: true,
        })
        .set(...adminAuthToken)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will return a 400 response if the query string is invalid', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .set(...ownerAuthToken)
        .query({
          showFinalized: 'sure',
          owner: 3,
          skip: -3,
          limit: 'lots',
        })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(getUrl()).expect(401);
    });

    it('will return a 403 response if the user is not authorized to view the target user', async () => {
      await request(server)
        .get(getUrl())
        .set(...otherUserAuthToken)
        .expect(403);
    });

    it('will return a 404 response if the target user is not found', async () => {
      await request(server)
        .get(getUrl('the_dude'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 501 response if the feature flag has not been enabled', async () => {
      configCatClient.flags[LogImportFeature.key] = false;

      await request(server)
        .get(getUrl())
        .set(...ownerAuthToken)
        .expect(501);
    });
  });
});
