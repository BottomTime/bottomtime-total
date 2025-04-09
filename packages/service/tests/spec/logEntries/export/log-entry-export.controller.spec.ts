import {
  LogEntryDTO,
  LogEntrySortBy,
  SortOrder,
  UserRole,
} from '@bottomtime/api';

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
import { createLogEntryFactory } from 'tests/utils/create-log-entry-factory';
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

  let entryFactory: LogEntryFactory;

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

    entryFactory = createLogEntryFactory();

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
      (a, b) => b.entryTime.valueOf() - a.entryTime.valueOf(),
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

  it('will export with a few filters', async () => {
    const OneHundredDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 100;
    const expected = entries.filter(
      (entry) =>
        entry.entryTime.valueOf() >= OneHundredDaysAgo &&
        (entry.rating ?? 0) >= 2 &&
        (entry.rating ?? 0) <= 5,
    );
    const { body } = await request(server)
      .get(getUrl())
      .set(...authHeader)
      .query({
        startDate: OneHundredDaysAgo,
        endDate: Date.now(),
        minRating: 2,
        maxRating: 5,
      })
      .expect(200);

    expect(body.data.length).toBe(expected.length);
    expect(body.totalCount).toBe(expected.length);
    body.data.forEach((entry: LogEntryDTO, index: number) => {
      expect(entry).toEqual(
        entryFactory.createLogEntry(expected[index]).toJSON(),
      );
    });
  });

  it('will export with an alternate sort order', async () => {
    const expected = entries.sort(
      (a, b) => a.entryTime.valueOf() - b.entryTime.valueOf(),
    );
    const { body } = await request(server)
      .get(getUrl())
      .set(...authHeader)
      .query({
        sortBy: LogEntrySortBy.EntryTime,
        sortOrder: SortOrder.Ascending,
      })
      .expect(200);

    expect(body.data.length).toBe(expected.length);
    expect(body.totalCount).toBe(expected.length);
    expected.forEach((entry, index) => {
      expect(body.data[index]).toEqual(
        entryFactory.createLogEntry(entry).toJSON(),
      );
    });
  });

  it('will allow specific entries to be omitted', async () => {
    const ids = [
      entries[0].id,
      entries[13].id,
      entries[26].id,
      entries[303].id,
      entries[411].id,
    ];
    const idSet = new Set(ids);
    const { body } = await request(server)
      .get(getUrl())
      .set(...authHeader)
      .query({
        omit: ids,
      })
      .expect(200);

    expect(body.data.length).toBe(entries.length - ids.length);
    body.data.forEach((entry: LogEntryDTO) => {
      expect(idSet.has(entry.id)).toBe(false);
    });
  });

  it('will allow specific entries to be included', async () => {
    const ids = [
      entries[0].id,
      entries[13].id,
      entries[26].id,
      entries[303].id,
      entries[411].id,
    ];
    const idSet = new Set(ids);
    const { body } = await request(server)
      .get(getUrl())
      .set(...authHeader)
      .query({
        include: ids,
      })
      .expect(200);

    expect(body.data.length).toBe(ids.length);
    body.data.forEach((entry: LogEntryDTO) => {
      expect(idSet.has(entry.id)).toBe(true);
    });
  });

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
