import { LogBookSharing, UserRole } from '@bottomtime/api';

import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import request from 'supertest';
import { Repository } from 'typeorm';

import {
  FriendshipEntity,
  LogEntryAirEntity,
  LogEntryEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSitesModule } from '../../../src/diveSites';
import { FriendsModule } from '../../../src/friends';
import { LogEntriesService } from '../../../src/logEntries/log-entries.service';
import { LogEntryFactory } from '../../../src/logEntries/log-entry-factory';
import { UserLogEntriesController } from '../../../src/logEntries/user-log-entries.controller';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import {
  createAuthHeader,
  createTestApp,
  createTestLogEntry,
  createTestUser,
} from '../../utils';

dayjs.extend(timezone);
dayjs.extend(utc);

const RegularUsername = 'mah_dude';
const FriendUsername = 'friendo';
const LogEntryId = '55896764-386d-47f8-8b09-ed5c9771ad93';
const PersonalLogEntryId = 'a2e86d19-0bf4-438b-b653-9ad6ae45edb8';
const LogbookUrl = `/api/users/${FriendUsername}/logbook`;
const LogEntryUrl = `${LogbookUrl}/${LogEntryId}`;

const PersonalLogbookUrl = `/api/users/${RegularUsername}/logbook`;
const PersonalLogEntryUrl = `${PersonalLogbookUrl}/${PersonalLogEntryId}`;

async function makeFriends(
  friends: Repository<FriendshipEntity>,
  userId: string,
  friendId: string,
): Promise<void> {
  const now = new Date();
  await friends.save([
    {
      id: 'c9ece67d-4c15-400e-b82a-55465886bcdd',
      friendsSince: now,
      user: { id: userId },
      friend: { id: friendId },
    },
    {
      id: 'f7f9a3fa-2b3a-4d19-a133-9e1551092c53',
      friendsSince: now,
      user: { id: friendId },
      friend: { id: userId },
    },
  ]);
}

describe('Log entries E2E security', () => {
  let app: INestApplication;
  let server: unknown;
  let Users: Repository<UserEntity>;
  let Friends: Repository<FriendshipEntity>;
  let LogEntries: Repository<LogEntryEntity>;

  let regularUser: UserEntity;
  let adminUser: UserEntity;
  let targetUser: UserEntity;
  let logEntry: LogEntryEntity;
  let personalLogEntry: LogEntryEntity;

  let regularAuthToken: [string, string];
  let adminAuthToken: [string, string];

  beforeAll(async () => {
    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([LogEntryEntity, LogEntryAirEntity]),
        DiveSitesModule,
        FriendsModule,
        UsersModule,
      ],
      providers: [LogEntriesService, LogEntryFactory],
      controllers: [UserLogEntriesController],
    });
    server = app.getHttpServer();

    regularUser = createTestUser({
      role: UserRole.User,
      username: RegularUsername,
      usernameLowered: RegularUsername.toLowerCase(),
    });
    adminUser = createTestUser({
      role: UserRole.Admin,
    });
    personalLogEntry = createTestLogEntry(regularUser, {
      id: PersonalLogEntryId,
    });

    regularAuthToken = await createAuthHeader(regularUser.id);
    adminAuthToken = await createAuthHeader(adminUser.id);

    Users = dataSource.getRepository(UserEntity);
    Friends = dataSource.getRepository(FriendshipEntity);
    LogEntries = dataSource.getRepository(LogEntryEntity);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('for public logbooks', () => {
    beforeEach(async () => {
      targetUser = createTestUser({
        logBookSharing: LogBookSharing.Public,
        username: FriendUsername,
        usernameLowered: FriendUsername.toLowerCase(),
      });
      logEntry = createTestLogEntry(targetUser, { id: LogEntryId });
      await Users.save([regularUser, adminUser, targetUser]);
      await LogEntries.save([logEntry, personalLogEntry]);
    });

    it('will allow anonymous users to query logbooks', async () => {
      await request(server).get(LogbookUrl).expect(200);
    });

    it('will allow anonymous users to request a log entry', async () => {
      await request(server).get(LogEntryUrl).expect(200);
    });

    it('will allow users to query their own logbooks', async () => {
      await request(server)
        .get(PersonalLogbookUrl)
        .set(...regularAuthToken)
        .expect(200);
    });

    it('will allow users to request a log entry from their own logbooks', async () => {
      await request(server)
        .get(PersonalLogEntryUrl)
        .set(...regularAuthToken)
        .expect(200);
    });

    it('will allow regular users to query logbooks', async () => {
      await request(server)
        .get(LogbookUrl)
        .set(...regularAuthToken)
        .expect(200);
    });

    it('will allow regular users to request a log entry', async () => {
      await request(server)
        .get(LogEntryUrl)
        .set(...regularAuthToken)
        .expect(200);
    });

    it('will allow admin users to query logbooks', async () => {
      await request(server)
        .get(LogbookUrl)
        .set(...adminAuthToken)
        .expect(200);
    });

    it('will allow admin users to request a log entry', async () => {
      await request(server)
        .get(LogEntryUrl)
        .set(...adminAuthToken)
        .expect(200);
    });
  });

  describe('for friends-only logbooks', () => {
    beforeEach(async () => {
      targetUser = createTestUser({
        logBookSharing: LogBookSharing.FriendsOnly,
        username: FriendUsername,
        usernameLowered: FriendUsername.toLowerCase(),
      });
      logEntry = createTestLogEntry(targetUser, { id: LogEntryId });
      await Users.save([regularUser, adminUser, targetUser]);
      await LogEntries.save([logEntry, personalLogEntry]);
    });

    it('will not allow anonymous users to query logbooks', async () => {
      await request(server).get(LogbookUrl).expect(401);
    });

    it('will not allow anonymous users to request a log entry', async () => {
      await request(server).get(LogEntryUrl).expect(401);
    });

    it('will allow regular users to query their own logbooks', async () => {
      await request(server)
        .get(PersonalLogbookUrl)
        .set(...regularAuthToken)
        .expect(200);
    });

    it('will allow regular users to request a log entry from their own logbooks', async () => {
      await request(server)
        .get(PersonalLogEntryUrl)
        .set(...regularAuthToken)
        .expect(200);
    });

    it('will not allow regular users to query logbooks of other users that are not friended', async () => {
      await request(server)
        .get(LogbookUrl)
        .set(...regularAuthToken)
        .expect(403);
    });

    it('will not allow regular users to request a log entry from logbooks of other users that are not friended', async () => {
      await request(server)
        .get(LogEntryUrl)
        .set(...regularAuthToken)
        .expect(403);
    });

    it('will allow regular users to query logbooks of other users that are friended', async () => {
      await makeFriends(Friends, regularUser.id, targetUser.id);
      await request(server)
        .get(LogbookUrl)
        .set(...regularAuthToken)
        .expect(200);
    });

    it('will allow regular users to request a log entry from logbooks of other users that are friended', async () => {
      await makeFriends(Friends, regularUser.id, targetUser.id);
      await request(server)
        .get(LogEntryUrl)
        .set(...regularAuthToken)
        .expect(200);
    });

    it('will allow admin users to query logbooks of other users', async () => {
      await request(server)
        .get(LogbookUrl)
        .set(...adminAuthToken)
        .expect(200);
    });

    it('will allow admin users to request a log entry from logbooks of other users', async () => {
      await request(server)
        .get(LogEntryUrl)
        .set(...adminAuthToken)
        .expect(200);
    });
  });

  describe('for private logbooks', () => {
    beforeEach(async () => {
      targetUser = createTestUser({
        logBookSharing: LogBookSharing.Private,
        username: FriendUsername,
        usernameLowered: FriendUsername.toLowerCase(),
      });
      logEntry = createTestLogEntry(targetUser, { id: LogEntryId });
      await Users.save([regularUser, adminUser, targetUser]);
      await LogEntries.save([logEntry, personalLogEntry]);
    });

    it('will not allow anonymous users to query logbooks', async () => {
      await request(server).get(LogbookUrl).expect(401);
    });

    it('will not allow anonymous users to request a log entry', async () => {
      await request(server).get(LogEntryUrl).expect(401);
    });

    it('will allow regular users to query their own logbooks', async () => {
      await request(server)
        .get(PersonalLogbookUrl)
        .set(...regularAuthToken)
        .expect(200);
    });

    it('will allow regular users to request a log entry from their own logbooks', async () => {
      await request(server)
        .get(PersonalLogEntryUrl)
        .set(...regularAuthToken)
        .expect(200);
    });

    it('will not allow regular users to query logbooks of other users - even if friended', async () => {
      await makeFriends(Friends, regularUser.id, targetUser.id);
      await request(server)
        .get(LogbookUrl)
        .set(...regularAuthToken)
        .expect(403);
    });

    it('will not allow regular users to request a log entry from logbooks of other users - even if friended', async () => {
      await makeFriends(Friends, regularUser.id, targetUser.id);
      await request(server)
        .get(LogEntryUrl)
        .set(...regularAuthToken)
        .expect(403);
    });

    it('will allow admin users to query logbooks of other users', async () => {
      await request(server)
        .get(LogbookUrl)
        .set(...adminAuthToken)
        .expect(200);
    });

    it('will allow admin users to request a log entry from logbooks of other users', async () => {
      await request(server)
        .get(LogEntryUrl)
        .set(...adminAuthToken)
        .expect(200);
    });
  });
});
