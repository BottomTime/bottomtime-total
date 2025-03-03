import {
  ApiList,
  BuddyType,
  CreateOrUpdateLogEntrySignatureDTO,
  LogBookSharing,
  LogEntrySignatureDTO,
  UserRole,
} from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { Repository } from 'typeorm';

import { CertificationsModule } from '../../../src/certifications';
import {
  AgencyEntity,
  FriendshipEntity,
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntrySampleEntity,
  LogEntrySignatureEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSitesModule } from '../../../src/diveSites';
import { FriendsModule } from '../../../src/friends';
import {
  LogEntriesService,
  LogEntryFactory,
  LogEntrySignatureFactory,
} from '../../../src/logEntries';
import { LogEntrySignaturesController } from '../../../src/logEntries/log-entry-signatures.controller';
import { LogEntrySignaturesService } from '../../../src/logEntries/log-entry-signatures.service';
import { OperatorsModule } from '../../../src/operators';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import { TestAgencies } from '../../fixtures/agencies';
import TestUsers from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestLogEntry,
  createTestUser,
  parseUserJSON,
} from '../../utils';

const EntryId = 'e630b211-a010-400f-bb61-cac4e9bbbf9a';

type UrlParams = Partial<{
  username: string;
  entryId: string;
  buddyName: string;
}>;
function getUrl(params?: UrlParams): string {
  const url = `/api/users/${
    params?.username ?? TestUsers[0].username
  }/logbook/${params?.entryId ?? EntryId}/signatures`;
  return params?.buddyName ? `${url}/${params.buddyName}` : url;
}

describe('Log entry signatures E2E tests', () => {
  let Agencies: Repository<AgencyEntity>;
  let Friends: Repository<FriendshipEntity>;
  let LogEntries: Repository<LogEntryEntity>;
  let Signatures: Repository<LogEntrySignatureEntity>;
  let Users: Repository<UserEntity>;

  let app: INestApplication;
  let server: HttpServer;

  let userData: UserEntity;
  let buddyData: UserEntity[];
  let otherUserData: UserEntity;
  let adminData: UserEntity;

  let logEntry: LogEntryEntity;
  let otherEntry: LogEntryEntity;

  let signatures: LogEntrySignatureEntity[];

  let authHeader: [string, string];
  let otherAuthHeader: [string, string];
  let adminAuthHeader: [string, string];

  async function makeFriends(): Promise<void> {
    await Friends.save([
      {
        friend: userData,
        user: otherUserData,
        id: 'c8d06e1a-2e87-426b-baf8-85f2ebf7446d',
        friendsSince: new Date(),
      },
      {
        friend: otherUserData,
        user: userData,
        id: '7a5899ad-c81c-47b9-9c50-099ed4bb3661',
        friendsSince: new Date(),
      },
    ]);
  }

  beforeAll(async () => {
    Agencies = dataSource.getRepository(AgencyEntity);
    Friends = dataSource.getRepository(FriendshipEntity);
    LogEntries = dataSource.getRepository(LogEntryEntity);
    Signatures = dataSource.getRepository(LogEntrySignatureEntity);
    Users = dataSource.getRepository(UserEntity);

    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          LogEntryEntity,
          LogEntrySignatureEntity,
          LogEntryAirEntity,
          LogEntrySampleEntity,
        ]),
        CertificationsModule,
        DiveSitesModule,
        FriendsModule,
        OperatorsModule,
        UsersModule,
      ],
      providers: [
        LogEntriesService,
        LogEntryFactory,
        LogEntrySignaturesService,
        LogEntrySignatureFactory,
      ],
      controllers: [LogEntrySignaturesController],
    });
    await app.init();
    server = app.getHttpServer();

    userData = {
      ...parseUserJSON(TestUsers[0]),
      logBookSharing: LogBookSharing.Private,
    };
    otherUserData = parseUserJSON(TestUsers[1]);
    adminData = createTestUser({ role: UserRole.Admin });
    buddyData = TestUsers.slice(2, 8).map(parseUserJSON);

    logEntry = createTestLogEntry(userData, { id: EntryId });
    otherEntry = createTestLogEntry(userData);

    signatures = [
      {
        id: 'ae465200-d2ad-4b0d-bd43-f5af23385330',
        buddy: buddyData[0],
        logEntry: logEntry,
        signed: new Date('2021-01-01T00:00:00Z'),
        type: BuddyType.Buddy,
        certificationNumber: null,
      },
      {
        id: '6d299310-d2a3-4893-b156-dd8cb6594196',
        buddy: buddyData[1],
        logEntry: logEntry,
        signed: new Date('2021-01-02T00:00:00Z'),
        certificationNumber: 'AB-123456',
        type: BuddyType.Divemaster,
        agency: TestAgencies[0],
      },
      {
        id: '80b19856-ab84-43f5-9f8f-91474376ae65',
        buddy: buddyData[2],
        logEntry: logEntry,
        signed: new Date('2021-01-02T08:00:00Z'),
        certificationNumber: 'XY-987654',
        type: BuddyType.Instructor,
        agency: TestAgencies[1],
      },
      {
        id: '72c32c4f-ef30-4661-a610-c13e1d023a64',
        buddy: buddyData[0],
        logEntry: otherEntry,
        signed: new Date('2021-01-01T00:00:00Z'),
        type: BuddyType.Buddy,
        certificationNumber: null,
      },
    ];

    [authHeader, otherAuthHeader, adminAuthHeader] = await Promise.all([
      createAuthHeader(userData.id),
      createAuthHeader(otherUserData.id),
      createAuthHeader(adminData.id),
    ]);
  });

  beforeEach(async () => {
    await Agencies.save(TestAgencies);
    await Users.save([userData, otherUserData, adminData, ...buddyData]);
    await LogEntries.save([logEntry, otherEntry]);
    await Signatures.save(signatures);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing signatures', () => {
    function validateResponse(results: ApiList<LogEntrySignatureDTO>) {
      expect(results.totalCount).toBe(3);
      expect(results.data).toHaveLength(3);
      expect(results.data[0].id).toBe(signatures[2].id);
      expect(results.data[0].buddy.userId).toBe(buddyData[2].id);
      expect(results.data[0].signedOn).toEqual(signatures[2].signed.valueOf());
      expect(results.data[0].agency!.id).toBe(TestAgencies[1].id);
      expect(results.data[0].certificationNumber).toBe(
        signatures[2].certificationNumber,
      );

      expect(results.data[1].id).toBe(signatures[1].id);
      expect(results.data[1].buddy.userId).toBe(buddyData[1].id);
      expect(results.data[1].signedOn).toEqual(signatures[1].signed.valueOf());
      expect(results.data[1].agency!.id).toBe(TestAgencies[0].id);
      expect(results.data[1].certificationNumber).toBe(
        signatures[1].certificationNumber,
      );

      expect(results.data[2].id).toBe(signatures[0].id);
      expect(results.data[2].buddy.userId).toBe(buddyData[0].id);
      expect(results.data[2].signedOn).toEqual(signatures[0].signed.valueOf());
      expect(results.data[2].agency).toBeUndefined();
      expect(results.data[2].certificationNumber).toBeUndefined();
    }

    it('will return results when the request is successful', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .set(...authHeader)
        .expect(200);
      validateResponse(body);
    });

    it('will allow an admin to request signatures for another user', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .set(...adminAuthHeader)
        .expect(200);
      validateResponse(body);
    });

    it('will return results if owner has a public logbook and the user is anonymous', async () => {
      await Users.update(userData.id, {
        logBookSharing: LogBookSharing.Public,
      });
      const { body } = await request(server).get(getUrl()).expect(200);
      validateResponse(body);
    });

    it('will return results if the owner has a friends-only logbook and the user is a friend', async () => {
      await Users.update(userData.id, {
        logBookSharing: LogBookSharing.FriendsOnly,
      });
      await makeFriends();
      const { body } = await request(server)
        .get(getUrl())
        .set(...otherAuthHeader)
        .expect(200);
      validateResponse(body);
    });

    it('will return a 401 response if the user has a friends-only logbook and the user is anonymous', async () => {
      await Users.update(userData.id, {
        logBookSharing: LogBookSharing.FriendsOnly,
      });
      await request(server).get(getUrl()).expect(401);
    });

    it('will return a 401 response if the user has a private logbook and the user is anonymous', async () => {
      await request(server).get(getUrl()).expect(401);
    });

    it('will return a 403 response if the user has a friends-only logbook and the user is not a friend', async () => {
      await Users.update(userData.id, {
        logBookSharing: LogBookSharing.FriendsOnly,
      });
      await request(server)
        .get(getUrl())
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 403 response if the user has a private logbook and the user is not the owner', async () => {
      await request(server)
        .get(getUrl())
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the logbook does not exist', async () => {
      await request(server)
        .get(getUrl({ username: 'no_such_user' }))
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the log entry does not exist', async () => {
      await request(server)
        .get(getUrl({ entryId: 'ab657888-8094-4f02-83d6-6af24e64174e' }))
        .set(...authHeader)
        .expect(404);
    });
  });

  describe('when retrieving a single signature', () => {
    it('will return a result when the request is successful', async () => {
      const { body } = await request(server)
        .get(getUrl({ buddyName: buddyData[1].username }))
        .set(...authHeader)
        .expect(200);
      expect(body.id).toBe(signatures[1].id);
      expect(body.buddy.userId).toBe(buddyData[1].id);
      expect(body.signedOn).toEqual(signatures[1].signed.valueOf());
      expect(body.agency.id).toBe(TestAgencies[0].id);
      expect(body.certificationNumber).toBe(signatures[1].certificationNumber);
    });

    it('will allow an admin to request a signature', async () => {
      const { body } = await request(server)
        .get(getUrl({ buddyName: buddyData[1].username }))
        .set(...adminAuthHeader)
        .expect(200);
      expect(body.id).toBe(signatures[1].id);
      expect(body.buddy.userId).toBe(buddyData[1].id);
      expect(body.signedOn).toEqual(signatures[1].signed.valueOf());
      expect(body.agency.id).toBe(TestAgencies[0].id);
      expect(body.certificationNumber).toBe(signatures[1].certificationNumber);
    });

    it('will return a result if owner has a public logbook and the user is anonymous', async () => {
      await Users.update(userData.id, {
        logBookSharing: LogBookSharing.Public,
      });
      const { body } = await request(server)
        .get(getUrl({ buddyName: buddyData[1].username }))
        .expect(200);
      expect(body.id).toBe(signatures[1].id);
      expect(body.buddy.userId).toBe(buddyData[1].id);
      expect(body.signedOn).toEqual(signatures[1].signed.valueOf());
      expect(body.agency.id).toBe(TestAgencies[0].id);
      expect(body.certificationNumber).toBe(signatures[1].certificationNumber);
    });

    it('will return a result if the owner has a friends-only logbook and the user is a friend', async () => {
      await Users.update(userData.id, {
        logBookSharing: LogBookSharing.FriendsOnly,
      });
      await makeFriends();
      const { body } = await request(server)
        .get(getUrl({ buddyName: buddyData[1].username }))
        .set(...otherAuthHeader)
        .expect(200);
      expect(body.id).toBe(signatures[1].id);
      expect(body.buddy.userId).toBe(buddyData[1].id);
      expect(body.signedOn).toEqual(signatures[1].signed.valueOf());
      expect(body.agency.id).toBe(TestAgencies[0].id);
      expect(body.certificationNumber).toBe(signatures[1].certificationNumber);
    });

    it('will return a 401 response if the user has a friends-only logbook and the user is anonymous', async () => {
      await Users.update(userData.id, {
        logBookSharing: LogBookSharing.FriendsOnly,
      });
      await request(server)
        .get(getUrl({ buddyName: buddyData[1].username }))
        .expect(401);
    });

    it('will return a 401 response if the user has a private logbook and the user is anonymous', async () => {
      await Users.update(userData.id, {
        logBookSharing: LogBookSharing.Private,
      });
      await request(server)
        .get(getUrl({ buddyName: buddyData[1].username }))
        .expect(401);
    });

    it('will return a 403 response if the user has a friends-only logbook and the user is not a friend', async () => {
      await Users.update(userData.id, {
        logBookSharing: LogBookSharing.FriendsOnly,
      });
      await request(server)
        .get(getUrl({ buddyName: buddyData[1].username }))
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 403 response if the user has a private logbook and the user is not the owner', async () => {
      await request(server)
        .get(getUrl({ buddyName: buddyData[1].username }))
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the logbook does not exist', async () => {
      await request(server)
        .get(
          getUrl({
            username: 'no_such_user',
            buddyName: buddyData[1].username,
          }),
        )
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the log entry does not exist', async () => {
      await request(server)
        .get(
          getUrl({
            entryId: '46c249c6-53d0-456b-97e3-02363d74fd8a',
            buddyName: buddyData[1].username,
          }),
        )
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the signature does not exist', async () => {
      await request(server)
        .get(getUrl({ buddyName: 'no_such_buddy' }))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the buddy has not signed the log entry', async () => {
      await request(server)
        .get(getUrl({ buddyName: buddyData[3].username }))
        .set(...authHeader)
        .expect(404);
    });
  });

  describe('when deleting a signature', () => {
    it('will delete a signature when the request is successful', async () => {
      await request(server)
        .delete(getUrl({ buddyName: buddyData[0].username }))
        .set(...authHeader)
        .expect(204);

      await expect(
        Signatures.findOneBy({ id: signatures[0].id }),
      ).resolves.toBeNull();
    });

    it('will allow an admin to delete a signature', async () => {
      await request(server)
        .delete(getUrl({ buddyName: buddyData[0].username }))
        .set(...adminAuthHeader)
        .expect(204);

      await expect(
        Signatures.findOneBy({ id: signatures[0].id }),
      ).resolves.toBeNull();
    });

    it('will return a 401 response if the user is anonymous', async () => {
      await request(server)
        .delete(getUrl({ buddyName: buddyData[0].username }))
        .expect(401);
    });

    it('will return a 403 response if the user is not the owner', async () => {
      await request(server)
        .delete(getUrl({ buddyName: buddyData[0].username }))
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the logbook does not exist', async () => {
      await request(server)
        .delete(
          getUrl({
            username: 'no_such_user',
            buddyName: buddyData[0].username,
          }),
        )
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the log entry does not exist', async () => {
      await request(server)
        .delete(
          getUrl({
            entryId: '135b57d2-7860-4d60-825f-1e5090670892',
            buddyName: buddyData[0].username,
          }),
        )
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the buddy does not exist', async () => {
      await request(server)
        .delete(
          getUrl({
            buddyName: 'no_such_buddy',
          }),
        )
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the buddy has not signed the log entry', async () => {
      await request(server)
        .delete(getUrl({ buddyName: buddyData[3].username }))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when creating or updating a signature', () => {
    let options: CreateOrUpdateLogEntrySignatureDTO;

    beforeAll(() => {
      options = {
        buddyType: BuddyType.Instructor,
        agency: TestAgencies[1].id,
        certificationNumber: 'CD-123456',
      };
    });

    it('will add a signature', async () => {
      const { body } = await request(server)
        .put(getUrl({ buddyName: otherUserData.username }))
        .set(...otherAuthHeader)
        .send(options)
        .expect(200);

      expect(body.id).toBeDefined();
      expect(body.signedOn).toBeCloseTo(Date.now(), -3);
      expect(body.buddy.userId).toBe(otherUserData.id);
      expect(body.type).toBe(options.buddyType);
      expect(body.agency.id).toBe(TestAgencies[1].id);
      expect(body.certificationNumber).toBe(options.certificationNumber);

      const saved = await Signatures.findOneOrFail({
        where: { id: body.id },
        relations: ['buddy', 'agency'],
      });
      expect(saved.id).toBe(body.id);
      expect(saved.signed.valueOf()).toBe(body.signedOn);
      expect(saved.buddy.id).toBe(otherUserData.id);
      expect(saved.type).toBe(options.buddyType);
      expect(saved.agency!.id).toBe(TestAgencies[1].id);
      expect(saved.certificationNumber).toBe(options.certificationNumber);
    });

    it('will update an existing signature', async () => {
      const signature: LogEntrySignatureEntity = {
        agency: TestAgencies[2],
        buddy: otherUserData,
        certificationNumber: 'X',
        id: '3fcb29a8-fd55-4c17-a7ff-7645884f09bb',
        logEntry,
        signed: new Date('2021-01-01T00:00:00Z'),
        type: BuddyType.Buddy,
      };
      await Signatures.save(signature);

      const { body } = await request(server)
        .put(getUrl({ buddyName: otherUserData.username }))
        .set(...otherAuthHeader)
        .send(options)
        .expect(200);

      expect(body.id).toBe(signature.id);
      expect(body.signedOn).toBe(signature.signed.valueOf());
      expect(body.buddy.userId).toBe(otherUserData.id);
      expect(body.type).toBe(options.buddyType);
      expect(body.agency.id).toBe(options.agency);
      expect(body.certificationNumber).toBe(options.certificationNumber);

      const saved = await Signatures.findOneOrFail({
        where: { id: signature.id },
        relations: ['buddy', 'agency'],
      });
      expect(saved.id).toBe(body.id);
      expect(saved.signed).toEqual(signature.signed);
      expect(saved.buddy.id).toBe(otherUserData.id);
      expect(saved.type).toBe(options.buddyType);
      expect(saved.agency!.id).toBe(options.agency);
      expect(saved.certificationNumber).toBe(options.certificationNumber);
    });

    it('will allow an admin to sign a logbook on behalf of another user', async () => {
      const { body } = await request(server)
        .put(getUrl({ buddyName: otherUserData.username }))
        .set(...adminAuthHeader)
        .send(options)
        .expect(200);

      expect(body.id).toBeDefined();
      expect(body.signedOn).toBeCloseTo(Date.now(), -3);
      expect(body.buddy.userId).toBe(otherUserData.id);
      expect(body.type).toBe(options.buddyType);
      expect(body.agency.id).toBe(TestAgencies[1].id);
      expect(body.certificationNumber).toBe(options.certificationNumber);

      const saved = await Signatures.findOneOrFail({
        where: { id: body.id },
        relations: ['buddy', 'agency'],
      });
      expect(saved.id).toBe(body.id);
      expect(saved.signed.valueOf()).toBe(body.signedOn);
      expect(saved.buddy.id).toBe(otherUserData.id);
      expect(saved.type).toBe(options.buddyType);
      expect(saved.agency!.id).toBe(TestAgencies[1].id);
      expect(saved.certificationNumber).toBe(options.certificationNumber);
    });

    it('will return a 400 response if the request body is missing', async () => {
      const { body } = await request(server)
        .put(getUrl({ buddyName: otherUserData.username }))
        .set(...otherAuthHeader)
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .put(getUrl({ buddyName: otherUserData.username }))
        .set(...otherAuthHeader)
        .send({
          buddy: 'steve!',
          BuddyType: 3,
          agency: TestAgencies[2].id,
          certificationNumber: false,
        })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the agency ID does not exist', async () => {
      const options: CreateOrUpdateLogEntrySignatureDTO = {
        buddyType: BuddyType.Instructor,
        agency: 'fe948bc1-3e7c-4129-ba63-45b8be48dd3a',
        certificationNumber: 'CD-123456',
      };

      await request(server)
        .put(getUrl({ buddyName: otherUserData.username }))
        .set(...otherAuthHeader)
        .send(options)
        .expect(400);
    });

    it('will return a 401 response if the user is anonymous', async () => {
      await request(server)
        .put(getUrl({ buddyName: otherUserData.username }))
        .send(options)
        .expect(401);
    });

    it('will return a 403 response if a user attempts to sign a log entry on behalf of another user', async () => {
      await request(server)
        .put(getUrl({ buddyName: buddyData[3].username }))
        .set(...otherAuthHeader)
        .send(options)
        .expect(403);
    });

    it('will return a 403 response if the user attempts to sign their own log entry', async () => {
      await request(server)
        .put(getUrl({ buddyName: userData.username }))
        .set(...authHeader)
        .send(options)
        .expect(403);
    });

    it('will return a 404 response if the logbook does not exist', async () => {
      await request(server)
        .put(
          getUrl({
            username: 'no_such_user',
            buddyName: otherUserData.username,
          }),
        )
        .set(...otherAuthHeader)
        .send(options)
        .expect(404);
    });

    it('will return a 404 response if the log entry does not exist', async () => {
      await request(server)
        .put(
          getUrl({
            entryId: '46c249c6-53d0-456b-97e3-02363d74fd8a',
            buddyName: otherUserData.username,
          }),
        )
        .set(...otherAuthHeader)
        .send(options)
        .expect(404);
    });
  });
});
