import { UserRole } from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntrySampleEntity,
  UserEntity,
} from 'src/data';
import { DiveSitesModule } from 'src/diveSites';
import { LogEntryFactory } from 'src/logEntries';
import { LogEntryExportController } from 'src/logEntries/export/log-entry-export.controller';
import { LogEntryExportService } from 'src/logEntries/export/log-entry-export.service';
import { OperatorsModule } from 'src/operators';
import { UsersModule } from 'src/users';
import request from 'supertest';
import { dataSource } from 'tests/data-source';
import {
  createAuthHeader,
  createTestApp,
  createTestLogEntry,
  createTestUser,
} from 'tests/utils';
import { Repository } from 'typeorm';

const Username = 'ExportyMcExportface_theThird';

function getUrl(username = Username): string {
  return `/api/users/${username}/logbook/export/json`;
}

describe('Log Entry Export E2E tests', () => {
  let app: INestApplication;
  let server: HttpServer;

  let Users: Repository<UserEntity>;
  let Entries: Repository<LogEntryEntity>;
  let Air: Repository<LogEntryAirEntity>;

  let owner: UserEntity;
  let otherUser: UserEntity;
  let admin: UserEntity;

  let entries: LogEntryEntity[];
  let air: LogEntryAirEntity[];

  let authHeader: [string, string];
  let otherAuthHeader: [string, string];
  let adminAuthHeader: [string, string];

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    Entries = dataSource.getRepository(LogEntryEntity);
    Air = dataSource.getRepository(LogEntryAirEntity);

    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          LogEntryEntity,
          LogEntryAirEntity,
          LogEntrySampleEntity,
        ]),
        UsersModule,
        DiveSitesModule,
        OperatorsModule,
      ],
      providers: [LogEntryExportService, LogEntryFactory],
      controllers: [LogEntryExportController],
    });

    owner = createTestUser({
      username: Username,
      usernameLowered: Username.toLowerCase(),
    });
    otherUser = createTestUser();
    admin = createTestUser({ role: UserRole.Admin });

    entries = Array.from({ length: 450 }, () => createTestLogEntry(owner)).sort(
      (a, b) => a.entryTime.valueOf() - b.entryTime.valueOf(),
    );
    air = entries.reduce<LogEntryAirEntity[]>((acc, entry) => {
      if (entry.air) acc.push(...entry.air);
      return acc;
    }, []);

    [authHeader, otherAuthHeader, adminAuthHeader] = await Promise.all([
      createAuthHeader(owner.id),
      createAuthHeader(otherUser.id),
      createAuthHeader(admin.id),
    ]);

    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await Users.save([owner, otherUser, admin]);
    await Entries.save(entries);
    await Air.save(air);
  });

  afterAll(async () => {
    await app.close();
  });

  it('will export the indicated logbook, unfiltered', async () => {
    const { body } = await request(server)
      .get(getUrl())
      .set(...authHeader)
      .expect(200);
    expect(body.data.length).toBe(entries.length);
    expect(body.totalCount).toBe(entries.length);
  });

  it('will export with a few filters', async () => {});

  it('will export with an alternate sort order', async () => {});

  it('will allow specific entries to be omitted', async () => {});

  it('will allow specific entries to be included', async () => {});

  it('will return a 400 response if the query string is invalid', async () => {
    const { body } = await request(server)
      .get(getUrl())
      .set(...authHeader)
      .query({
        query: true,
        startDate: 'yesterday',
        endDate: 'tomorrow',
        location: {
          lat: 1111,
          lon: -1883,
        },
        radius: -8,
        minRating: 'ok',
        maxRating: 5.5,
        sortBy: 'time',
        sortOrder: 'backward',
        include: 7,
        omit: 'sure',
      })
      .expect(400);

    expect(body.details).toMatchSnapshot();
  });

  it('will return a 401 response if the request is unauthenticated', async () => {
    await request(server).get(getUrl()).expect(401);
  });

  it('will return a 403 response if the user is not authorized to export the logbook', async () => {
    await request(server)
      .get(getUrl())
      .set(...otherAuthHeader)
      .expect(403);
  });

  it('will return a 404 response if the indicated logbook does not exist', async () => {
    await request(server)
      .get(getUrl('no_such_user'))
      .set(...adminAuthHeader)
      .expect(404);
  });
});
