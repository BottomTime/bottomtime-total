import {
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  LogNumberGenerationMode,
  UserRole,
} from '@bottomtime/api';
import { LogImportFeature } from '@bottomtime/common';

import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Server } from 'http';
import { Mock } from 'moq.ts';
import { EMPTY } from 'rxjs';
import request from 'supertest';
import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
  LogEntrySampleEntity,
  UserEntity,
} from '../../../../src/data';
import { ConfigCatClient } from '../../../../src/dependencies';
import { DiveSiteFactory, DiveSitesModule } from '../../../../src/diveSites';
import { FeaturesModule } from '../../../../src/features';
import { LogEntriesService, LogEntryFactory } from '../../../../src/logEntries';
import { Importer } from '../../../../src/logEntries/import/importer';
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

dayjs.extend(utc);
dayjs.extend(tz);

const OwnerData: Partial<UserEntity> = {
  id: '09f877b6-6744-4e2f-9d19-7e2bd5941fee',
  username: 'testuser',
};
const OtherUserData: Partial<UserEntity> = {
  id: '20c46034-90e1-4393-97e5-197f6be9f1ea',
  username: 'other_guy23',
};

function getBaseUrl(importId: string, username?: string): string {
  return `/api/users/${username || OwnerData.username}/logImports/${importId}`;
}

function getFinalizeUrl(importId: string, username?: string): string {
  return `${getBaseUrl(importId, username)}/finalize`;
}

describe('Log entry import session E2E tests', () => {
  let app: INestApplication;
  let server: Server;
  let features: ConfigCatClientMock;

  let Users: Repository<UserEntity>;
  let Entries: Repository<LogEntryEntity>;
  let Imports: Repository<LogEntryImportEntity>;
  let ImportRecords: Repository<LogEntryImportRecordEntity>;
  let entryFactory: LogEntryFactory;
  let importer: Importer;

  let owner: UserEntity;
  let otherUser: UserEntity;
  let admin: UserEntity;
  let ownerAuthToken: [string, string];
  let otherUserAuthToken: [string, string];
  let adminAuthToken: [string, string];
  let testData: LogEntryImportEntity[];

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    Entries = dataSource.getRepository(LogEntryEntity);
    Imports = dataSource.getRepository(LogEntryImportEntity);
    ImportRecords = dataSource.getRepository(LogEntryImportRecordEntity);

    features = new ConfigCatClientMock();
    entryFactory = new LogEntryFactory(
      Entries,
      dataSource.getRepository(LogEntryAirEntity),
      dataSource.getRepository(LogEntrySampleEntity),
      new Mock<DiveSiteFactory>().object(),
    );
    importer = new Importer(dataSource, entryFactory);
    app = await createTestApp(
      {
        imports: [
          TypeOrmModule.forFeature([
            UserEntity,
            LogEntryEntity,
            LogEntryAirEntity,
            LogEntrySampleEntity,
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
          Importer,
        ],
        controllers: [LogEntryImportController],
      },
      {
        provide: ConfigCatClient,
        use: features,
      },
      {
        provide: Importer,
        use: importer,
      },
    );
    await app.init();
    server = app.getHttpAdapter().getInstance();

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
        .get(getBaseUrl(importData.id))
        .set(...ownerAuthToken)
        .expect(200);

      expect(body).toEqual({
        bookmark: importData.bookmark,
        date: importData.date.toISOString(),
        device: importData.device,
        deviceId: importData.deviceId,
        failed: false,
        finalized: false,
        id: importData.id,
        owner: OwnerData.username,
      });
    });

    it('will return the indicated session for an admin', async () => {
      const { body } = await request(server)
        .get(getBaseUrl(importData.id))
        .set(...adminAuthToken)
        .expect(200);

      expect(body).toEqual({
        bookmark: importData.bookmark,
        date: importData.date.toISOString(),
        device: importData.device,
        deviceId: importData.deviceId,
        failed: false,
        finalized: false,
        id: importData.id,
        owner: OwnerData.username,
      });
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).get(getBaseUrl(importData.id)).expect(401);
    });

    it('will return a 403 response if user is not authorized to view the session', async () => {
      await request(server)
        .get(getBaseUrl(importData.id))
        .set(...otherUserAuthToken)
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .get(getBaseUrl(importData.id, 'no_such_user'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 404 response if the session does not exist', async () => {
      await request(server)
        .get(getBaseUrl('ca76e905-6604-4f18-b8ac-ec4524025ac8'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 501 response if the feature flag is disabled', async () => {
      features.flags[LogImportFeature.key] = false;
      await request(server)
        .get(getBaseUrl(importData.id))
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
        .delete(getBaseUrl(importData.id))
        .set(...ownerAuthToken)
        .expect(200);

      expect(body).toEqual({
        bookmark: importData.bookmark,
        date: importData.date.toISOString(),
        device: importData.device,
        deviceId: importData.deviceId,
        failed: false,
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
        .delete(getBaseUrl(importData.id))
        .set(...adminAuthToken)
        .expect(200);

      expect(body).toEqual({
        bookmark: importData.bookmark,
        failed: false,
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
      await request(server).delete(getBaseUrl(importData.id)).expect(401);
    });

    it('will return a 403 response if the user is not authorized to cancel the session', async () => {
      await request(server)
        .delete(getBaseUrl(importData.id))
        .set(...otherUserAuthToken)
        .expect(403);
    });

    it('will return a 404 if the indicated user does not exist', async () => {
      await request(server)
        .delete(getBaseUrl(importData.id, 'no_such_user'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 404 response if the session does not exist', async () => {
      await request(server)
        .delete(getBaseUrl('ca76e905-6604-4f18-b8ac-ec4524025ac8'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 405 response if the session has already been finalized', async () => {
      await Imports.update(importData.id, { finalized: new Date() });
      await request(server)
        .delete(getBaseUrl(importData.id))
        .set(...ownerAuthToken)
        .expect(405);
    });

    it('will return a 501 response if the feature flag is disabled', async () => {
      features.flags[LogImportFeature.key] = false;
      await request(server)
        .delete(getBaseUrl(importData.id))
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
        .post(getBaseUrl(importSession.id))
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
        .post(getBaseUrl(importSession.id))
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
        .post(getBaseUrl(importSession.id))
        .set(...ownerAuthToken)
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getBaseUrl(importSession.id))
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
        .post(getBaseUrl(importSession.id))
        .send([])
        .set(...ownerAuthToken)
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(getBaseUrl(importSession.id))
        .send(importRecords.slice(0, 10))
        .expect(401);
    });

    it('will return a 403 response if the user is not authorized to modify the import session', async () => {
      await request(server)
        .post(getBaseUrl(importSession.id))
        .set(...otherUserAuthToken)
        .send(importRecords.slice(0, 10))
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .post(getBaseUrl(importSession.id, 'no_such_user'))
        .set(...adminAuthToken)
        .send(importRecords.slice(0, 10))
        .expect(404);
    });

    it('will return a 404 response if the import session does not exist', async () => {
      await request(server)
        .post(getBaseUrl('ce9d2317-be9a-422b-8b87-d9579a307e39'))
        .set(...adminAuthToken)
        .send(importRecords.slice(0, 10))
        .expect(404);
    });

    it('will return a 413 response if the request body is too large', async () => {
      await request(server)
        .post(getBaseUrl(importSession.id))
        .set(...adminAuthToken)
        .send(importRecords)
        .expect(413);
    });

    it('will return a 501 response if the feature flag is not enabled', async () => {
      features.flags[LogImportFeature.key] = false;
      await request(server)
        .post(getBaseUrl(importSession.id))
        .set(...adminAuthToken)
        .send(importRecords.slice(0, 50))
        .expect(501);
    });
  });

  describe('when finalizing an import', () => {
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
      await ImportRecords.save(
        importRecords.map(
          (ir): LogEntryImportRecordEntity => ({
            id: uuid(),
            import: importSession,
            data: JSON.stringify(ir),
          }),
        ),
      );
      features.flags[LogImportFeature.key] = true;
    });

    it('will finalize an import session', async () => {
      const importSpy = jest.spyOn(importer, 'doImport').mockReturnValue(EMPTY);
      await request(server)
        .post(getFinalizeUrl(importSession.id))
        .set(...ownerAuthToken)
        .expect(202);

      expect(importSpy).toHaveBeenCalled();
      const [importData, owner] = importSpy.mock.calls[0];
      expect(importData.id).toBe(importSession.id);
      expect(owner.id).toBe(OwnerData.id);
    });

    it("will allow an admin to finalize another user's import", async () => {
      const importSpy = jest.spyOn(importer, 'doImport').mockReturnValue(EMPTY);
      await request(server)
        .post(getFinalizeUrl(importSession.id))
        .set(...adminAuthToken)
        .expect(202);

      expect(importSpy).toHaveBeenCalled();
      const [importData, owner] = importSpy.mock.calls[0];
      expect(importData.id).toBe(importSession.id);
      expect(owner.id).toBe(OwnerData.id);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      let response = await request(server)
        .post(getFinalizeUrl(importSession.id))
        .set(...ownerAuthToken)
        .send({
          logNumberGenerationMode: 'whatever',
          startingLogNumber: -1,
        })
        .expect(400);
      expect(response.body.details).toMatchSnapshot();

      response = await request(server)
        .post(getFinalizeUrl(importSession.id))
        .set(...ownerAuthToken)
        .send({
          logNumberGenerationMode: LogNumberGenerationMode.All,
        })
        .expect(400);
      expect(response.body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).post(getFinalizeUrl(importSession.id)).expect(401);
    });

    it('will return a 403 if the user is not authorized to finalize the import session', async () => {
      await request(server)
        .post(getFinalizeUrl(importSession.id))
        .set(...otherUserAuthToken)
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .post(getFinalizeUrl(importSession.id, 'no_such_user'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 404 response if import ID is not found', async () => {
      await request(server)
        .post(getFinalizeUrl('0a227c77-1d32-4ef9-a20b-e6103c96769f'))
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 405 response if the import session is already finalized', async () => {
      await Imports.update(importSession.id, { finalized: new Date() });
      await ImportRecords.delete({});
      await request(server)
        .post(getFinalizeUrl(importSession.id))
        .set(...ownerAuthToken)
        .expect(405);
    });

    it('will return a 501 response if the feature flag is not enabled', async () => {
      features.flags[LogImportFeature.key] = false;
      await request(server)
        .post(getFinalizeUrl(importSession.id))
        .set(...adminAuthToken)
        .expect(501);
    });
  });
});
