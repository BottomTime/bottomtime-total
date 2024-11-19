import {
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  UserRole,
} from '@bottomtime/api';
import { LogImportFeature } from '@bottomtime/common';

import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Server } from 'http';
import request from 'supertest';
import { Repository } from 'typeorm';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
  UserEntity,
} from '../../../../src/data';
import { ConfigCatClient } from '../../../../src/dependencies';
import { DiveSitesModule } from '../../../../src/diveSites';
import { FeaturesModule } from '../../../../src/features';
import { LogEntriesService, LogEntryFactory } from '../../../../src/logEntries';
import { LogEntryImportFactory } from '../../../../src/logEntries/import/log-entry-import-factory';
import { LogEntryImportController } from '../../../../src/logEntries/import/log-entry-import.controller';
import { LogEntryImportService } from '../../../../src/logEntries/import/log-entry-import.service';
import { UsersModule } from '../../../../src/users';
import { dataSource } from '../../../data-source';
import TestImportRecords from '../../../fixtures/import-records.json';
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
  let ImportRecords: Repository<LogEntryImportRecordEntity>;

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
            LogEntryAirEntity,
            LogEntryImportEntity,
            LogEntryImportRecordEntity,
          ]),
          DiveSitesModule,
          FeaturesModule,
          UsersModule,
        ],
        providers: [
          LogEntryImportFactory,
          LogEntryImportService,
          LogEntryFactory,
          LogEntriesService,
        ],
        controllers: [LogEntryImportController],
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
    ImportRecords = dataSource.getRepository(LogEntryImportRecordEntity);

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

  describe('when adding a batch of new records to the import session', () => {
    let importRecords: CreateOrUpdateLogEntryParamsDTO[];
    let importSession: LogEntryImportEntity;

    beforeAll(() => {
      importRecords = TestImportRecords.map((ir) =>
        CreateOrUpdateLogEntryParamsSchema.parse(JSON.parse(ir.data)),
      ).sort((a, b) =>
        b.timing.entryTime.date.localeCompare(a.timing.entryTime.date),
      );
    });

    beforeEach(async () => {
      importSession = { ...testData[8], finalized: null };
      await Imports.save(importSession);
    });

    it('will commit new records to the session', async () => {
      const expected = importRecords.slice(0, 20);
      const { body } = await request(server)
        .post(getUrl(importSession.id))
        .set(...ownerAuthToken)
        .send(expected)
        .expect(201);

      expect(body).toEqual({
        addedRecords: expected.length,
        totalRecords: expected.length,
      });

      const actual = (
        await ImportRecords.findBy({
          import: { id: importSession.id },
        })
      )
        .map((ir) =>
          CreateOrUpdateLogEntryParamsSchema.parse(JSON.parse(ir.data)),
        )
        .sort((a, b) =>
          b.timing.entryTime.date.localeCompare(a.timing.entryTime.date),
        );
      expect(actual).toHaveLength(expected.length);
      expect(actual).toEqual(expected);
    });

    it("will allow an admin to commit records to another user's import session", async () => {
      const expected = importRecords.slice(0, 20);
      const { body } = await request(server)
        .post(getUrl(importSession.id))
        .set(...adminAuthToken)
        .send(expected)
        .expect(201);

      expect(body).toEqual({
        addedRecords: expected.length,
        totalRecords: expected.length,
      });

      const actual = (
        await ImportRecords.findBy({
          import: { id: importSession.id },
        })
      )
        .map((ir) =>
          CreateOrUpdateLogEntryParamsSchema.parse(JSON.parse(ir.data)),
        )
        .sort((a, b) =>
          b.timing.entryTime.date.localeCompare(a.timing.entryTime.date),
        );
      expect(actual).toHaveLength(expected.length);
      expect(actual).toEqual(expected);
    });

    it('will return a 400 response if request body is missing', async () => {
      const { body } = await request(server)
        .post(getUrl(importSession.id))
        .set(...ownerAuthToken)
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getUrl(importSession.id))
        .send([
          {
            logNumber: 'seven',
            invalid: true,
          },
        ])
        .set(...ownerAuthToken)
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body contains no entries', async () => {
      const { body } = await request(server)
        .post(getUrl(importSession.id))
        .send([])
        .set(...ownerAuthToken)
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(getUrl(importSession.id))
        .send(importRecords.slice(0, 10))
        .expect(401);
    });

    it('will return a 403 response if the user is not authorized to modify the import session', async () => {
      await request(server)
        .post(getUrl(importSession.id))
        .set(...otherUserAuthToken)
        .send(importRecords.slice(0, 10))
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .post(getUrl(importSession.id, 'no_such_user'))
        .set(...adminAuthToken)
        .send(importRecords.slice(0, 10))
        .expect(404);
    });

    it('will return a 404 response if the import session does not exist', async () => {
      await request(server)
        .post(getUrl('ce9d2317-be9a-422b-8b87-d9579a307e39'))
        .set(...adminAuthToken)
        .send(importRecords.slice(0, 10))
        .expect(404);
    });

    it('will return a 413 response if the request body is too large', async () => {
      await request(server)
        .post(getUrl(importSession.id))
        .set(...adminAuthToken)
        .send(importRecords)
        .expect(413);
    });

    it('will return a 501 response if the feature flag is not enabled', async () => {
      features.flags[LogImportFeature.key] = false;
      await request(server)
        .post(getUrl(importSession.id))
        .set(...adminAuthToken)
        .send(importRecords.slice(0, 50))
        .expect(501);
    });
  });
});
