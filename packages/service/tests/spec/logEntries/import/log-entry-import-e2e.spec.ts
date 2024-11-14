import { UserRole } from '@bottomtime/api';
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
import { ImportController } from '../../../../src/logEntries/import/import.controller';
import { LogEntryImportFactory } from '../../../../src/logEntries/import/log-entry-import-factory';
import { LogEntryImportService } from '../../../../src/logEntries/import/log-entry-import.service';
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
  id: '09f877b6-6744-4e2f-9d19-7e2bd5941fee',
  username: 'testuser',
};
const OtherUserData: Partial<UserEntity> = {
  id: '20c46034-90e1-4393-97e5-197f6be9f1ea',
  username: 'other_guy23',
};

function getUrl(importId: string, username?: string): string {
  return `/api/users/${username || OwnerData.username}/logImports/${importId}`;
}

describe('Log entry import session E2E tests', () => {
  let app: INestApplication;
  let server: Server;
  let features: ConfigCatClientMock;

  let Users: Repository<UserEntity>;
  let Imports: Repository<LogEntryImportEntity>;

  let owner: UserEntity;
  let otherUser: UserEntity;
  let admin: UserEntity;
  let ownerAuthToken: [string, string];
  let otherUserAuthToken: [string, string];
  let adminAuthToken: [string, string];
  let testData: LogEntryImportEntity[];

  beforeAll(async () => {
    features = new ConfigCatClientMock();
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
        providers: [LogEntryImportFactory, LogEntryImportService],
        controllers: [ImportController],
      },
      {
        provide: ConfigCatClient,
        use: features,
      },
    );
    await app.init();
    server = app.getHttpAdapter().getInstance();

    Users = dataSource.getRepository(UserEntity);
    Imports = dataSource.getRepository(LogEntryImportEntity);

    owner = createTestUser(OwnerData);
    otherUser = createTestUser(OtherUserData);
    admin = createTestUser({ role: UserRole.Admin });
    testData = TestData.map((data, index) =>
      parseLogEntryImportJSON(data, index < 35 ? owner : otherUser),
    );

    [ownerAuthToken, otherUserAuthToken, adminAuthToken] = await Promise.all([
      createAuthHeader(owner.id),
      createAuthHeader(otherUser.id),
      createAuthHeader(admin.id),
    ]);
  });

  beforeEach(async () => {
    features.flags[LogImportFeature.key] = true;
    await Users.save([owner, otherUser, admin]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when requesting a single import session', () => {
    let importData: LogEntryImportEntity;

    beforeEach(async () => {
      importData = testData[2];
      await Imports.save(importData);
    });

    it('will return the indicated session', async () => {
      const { body } = await request(server)
        .get(getUrl(importData.id))
        .set(...ownerAuthToken)
        .expect(200);

      expect(body).toEqual({
        bookmark: importData.bookmark,
        date: importData.date.toISOString(),
        device: importData.device,
        deviceId: importData.deviceId,
        finalized: false,
        id: importData.id,
        owner: OwnerData.username,
      });
    });

    it('will return the indicated session for an admin', async () => {
      const { body } = await request(server)
        .get(getUrl(importData.id))
        .set(...adminAuthToken)
        .expect(200);

      expect(body).toEqual({
        bookmark: importData.bookmark,
        date: importData.date.toISOString(),
        device: importData.device,
        deviceId: importData.deviceId,
        finalized: false,
        id: importData.id,
        owner: OwnerData.username,
      });
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(getUrl(importData.id)).expect(401);
    });

    it('will return a 403 response if user is not authorized to view the session', async () => {
      await request(server)
        .get(getUrl(importData.id))
        .set(...otherUserAuthToken)
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .get(getUrl(importData.id, 'no_such_user'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 404 response if the session does not exist', async () => {
      await request(server)
        .get(getUrl('ca76e905-6604-4f18-b8ac-ec4524025ac8'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 501 response if the feature flag is disabled', async () => {
      features.flags[LogImportFeature.key] = false;
      await request(server)
        .get(getUrl(importData.id))
        .set(...ownerAuthToken)
        .expect(501);
    });
  });

  describe('when canceling an import session', () => {
    let importData: LogEntryImportEntity;

    beforeEach(async () => {
      importData = testData[3];
      await Imports.save(importData);
    });

    it('will cancel an import session and return its previous data', async () => {
      const { body } = await request(server)
        .delete(getUrl(importData.id))
        .set(...ownerAuthToken)
        .expect(200);

      expect(body).toEqual({
        bookmark: importData.bookmark,
        date: importData.date.toISOString(),
        device: importData.device,
        deviceId: importData.deviceId,
        finalized: false,
        id: importData.id,
        owner: OwnerData.username,
      });

      await expect(
        Imports.findOneBy({ id: importData.id }),
      ).resolves.toBeNull();
    });

    it("will allow an admin to cancel another user's import session", async () => {
      const { body } = await request(server)
        .delete(getUrl(importData.id))
        .set(...adminAuthToken)
        .expect(200);

      expect(body).toEqual({
        bookmark: importData.bookmark,
        date: importData.date.toISOString(),
        device: importData.device,
        deviceId: importData.deviceId,
        finalized: false,
        id: importData.id,
        owner: OwnerData.username,
      });

      await expect(
        Imports.findOneBy({ id: importData.id }),
      ).resolves.toBeNull();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl(importData.id)).expect(401);
    });

    it('will return a 403 response if the user is not authorized to cancel the session', async () => {
      await request(server)
        .delete(getUrl(importData.id))
        .set(...otherUserAuthToken)
        .expect(403);
    });

    it('will return a 404 if the indicated user does not exist', async () => {
      await request(server)
        .delete(getUrl(importData.id, 'no_such_user'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 404 response if the session does not exist', async () => {
      await request(server)
        .delete(getUrl('ca76e905-6604-4f18-b8ac-ec4524025ac8'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 405 response if the session has already been finalized', async () => {
      await Imports.update(importData.id, { finalized: new Date() });
      await request(server)
        .delete(getUrl(importData.id))
        .set(...ownerAuthToken)
        .expect(405);
    });

    it('will return a 501 response if the feature flag is disabled', async () => {
      features.flags[LogImportFeature.key] = false;
      await request(server)
        .delete(getUrl(importData.id))
        .set(...ownerAuthToken)
        .expect(501);
    });
  });
});
