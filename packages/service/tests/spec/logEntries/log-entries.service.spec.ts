import {
  DepthUnit,
  LogEntrySortBy,
  PressureUnit,
  SortOrder,
  TankMaterial,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import fs from 'fs/promises';
import path from 'path';
import { Repository } from 'typeorm';

import { User } from '../../../src/auth';
import {
  DiveSiteEntity,
  LogEntryAirEntity,
  LogEntryEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSiteFactory } from '../../../src/diveSites';
import {
  CreateLogEntryOptions,
  LogEntriesService,
} from '../../../src/logEntries';
import { LogEntryAirUtils } from '../../../src/logEntries/log-entry-air-utils';
import { LogEntryFactory } from '../../../src/logEntries/log-entry-factory';
import { dataSource } from '../../data-source';
import TestDiveSiteData from '../../fixtures/dive-sites.json';
import TestLogEntryData from '../../fixtures/log-entries.json';
import TestUserData from '../../fixtures/user-search-data.json';
import { createDiveSiteFactory } from '../../utils/create-dive-site-factory';
import { parseDiveSiteJSON } from '../../utils/create-test-dive-site';
import {
  createTestLogEntry,
  parseLogEntryJSON,
} from '../../utils/create-test-log-entry';
import { parseUserJSON } from '../../utils/create-test-user';

dayjs.extend(tz);
dayjs.extend(utc);

describe('Log entries service', () => {
  let Entries: Repository<LogEntryEntity>;
  let EntriesAir: Repository<LogEntryAirEntity>;
  let Users: Repository<UserEntity>;
  let DiveSites: Repository<DiveSiteEntity>;
  let siteFactory: DiveSiteFactory;
  let entryFactory: LogEntryFactory;
  let service: LogEntriesService;

  let ownerData: UserEntity[];
  let logEntryData: LogEntryEntity[];
  let airData: LogEntryAirEntity[];
  let diveSiteData: DiveSiteEntity[];

  beforeAll(() => {
    Entries = dataSource.getRepository(LogEntryEntity);
    EntriesAir = dataSource.getRepository(LogEntryAirEntity);
    Users = dataSource.getRepository(UserEntity);
    DiveSites = dataSource.getRepository(DiveSiteEntity);
    siteFactory = createDiveSiteFactory();
    entryFactory = new LogEntryFactory(Entries, EntriesAir, siteFactory);

    service = new LogEntriesService(Entries, entryFactory);

    ownerData = TestUserData.slice(0, 4).map((data) => parseUserJSON(data));
    diveSiteData = TestDiveSiteData.map((site, i) =>
      parseDiveSiteJSON(site, ownerData[i % 4]),
    );
    logEntryData = TestLogEntryData.map((data, i) =>
      parseLogEntryJSON(
        data,
        ownerData[i % ownerData.length],
        diveSiteData[i % diveSiteData.length],
      ),
    );

    airData = [];
    for (const entry of logEntryData) {
      if (entry.air) {
        for (let i = 0; i < entry.air.length; i++) {
          airData.push({
            ...entry.air[i],
            logEntry: { id: entry.id } as LogEntryEntity,
          });
        }
      }
    }
  });

  beforeEach(async () => {
    await Users.save(ownerData);
    await DiveSites.save(diveSiteData);
  });

  it.skip('will generate some sweet, sweet test data', async () => {
    const data = new Array<LogEntryEntity>(300);
    for (let i = 0; i < data.length; i++) {
      data[i] = createTestLogEntry(ownerData[i % 4]);
      data[i].owner = { id: data[i].owner.id } as UserEntity;
    }

    await fs.writeFile(
      path.resolve(__dirname, '../../fixtures/log-entries.json'),
      JSON.stringify(data, null, 2),
      'utf-8',
    );
  });

  describe('when creating a new log entry', () => {
    it('will create a new log entry with minimal options', async () => {
      const options: CreateLogEntryOptions = {
        owner: new User(Users, ownerData[0]),
        entryTime: {
          date: '2024-03-28T13:45:00',
          timezone: 'Europe/Amsterdam',
        },
        duration: 52,
      };

      const entry = await service.createLogEntry(options);
      expect(entry.id).toBeDefined();
      expect(entry.owner).toEqual({
        userId: ownerData[0].id,
        username: ownerData[0].username,
        memberSince: ownerData[0].memberSince,
        logBookSharing: ownerData[0].logBookSharing,
        name: ownerData[0].name,
        location: ownerData[0].location,
        avatar: ownerData[0].avatar,
      });
      expect(entry.entryTime).toEqual({
        date: '2024-03-28T13:45:00',
        timezone: 'Europe/Amsterdam',
      });
      expect(entry.duration).toEqual(options.duration);

      const saved = await Entries.findOneOrFail({
        where: { id: entry.id },
        relations: ['air', 'owner'],
      });
      expect(saved.entryTime).toEqual(entry.entryTime.date);
      expect(saved.timezone).toEqual(entry.entryTime.timezone);
      expect(saved.duration).toEqual(options.duration);
      expect(saved.owner.id).toEqual(ownerData[0].id);
      expect(saved.timestamp).toEqual(new Date('2024-03-28T12:45:00.000Z'));
      expect(saved.air).toHaveLength(0);
    });

    it('will create a new log entry with all options', async () => {
      const options: CreateLogEntryOptions = {
        owner: new User(Users, ownerData[0]),
        entryTime: {
          date: '2024-03-28T13:45:00',
          timezone: 'Europe/Amsterdam',
        },

        logNumber: 123,
        bottomTime: 48,
        duration: 52,
        maxDepth: {
          depth: 67,
          unit: DepthUnit.Feet,
        },
        notes: 'Great dive! Saw fish.',

        air: [
          {
            name: 'ornate parcel',
            material: TankMaterial.Steel,
            workingPressure: 3000,
            volume: 12,
            count: 1,
            startPressure: 3470,
            endPressure: 1210,
            pressureUnit: PressureUnit.PSI,
            o2Percent: 25.6,
          },
        ],
      };

      const entry = await service.createLogEntry(options);
      expect(entry.id).toBeDefined();
      expect(entry.logNumber).toEqual(options.logNumber);
      expect(entry.owner).toEqual({
        userId: ownerData[0].id,
        username: ownerData[0].username,
        memberSince: ownerData[0].memberSince,
        logBookSharing: ownerData[0].logBookSharing,
        name: ownerData[0].name,
        location: ownerData[0].location,
        avatar: ownerData[0].avatar,
      });
      expect(entry.entryTime).toEqual({
        date: '2024-03-28T13:45:00',
        timezone: 'Europe/Amsterdam',
      });
      expect(entry.bottomTime).toEqual(options.bottomTime);
      expect(entry.duration).toEqual(options.duration);
      expect(entry.maxDepth).toEqual({
        depth: 67,
        unit: DepthUnit.Feet,
      });
      expect(entry.notes).toEqual(options.notes);
      expect(entry.air).toEqual(options.air);

      const saved = await Entries.findOneOrFail({
        where: { id: entry.id },
        relations: ['air', 'owner'],
      });
      expect(saved.logNumber).toEqual(options.logNumber);
      expect(saved.entryTime).toEqual(options.entryTime.date);
      expect(saved.timezone).toEqual(options.entryTime.timezone);
      expect(saved.owner.id).toEqual(ownerData[0].id);
      expect(saved.timestamp).toEqual(new Date('2024-03-28T12:45:00.000Z'));
      expect(saved.bottomTime).toEqual(options.bottomTime);
      expect(saved.duration).toEqual(options.duration);
      expect(saved.maxDepth).toEqual(options.maxDepth!.depth);
      expect(saved.maxDepthUnit).toEqual(options.maxDepth!.unit);
      expect(saved.notes).toEqual(options.notes);
      expect(saved.air).toEqual(
        options.air!.map((tank, index) => ({
          ...LogEntryAirUtils.dtoToEntity(tank),
          id: saved.air![index].id,
          ordinal: index,
        })),
      );
    });

    it('will create a new log entry with a dive site attached', async () => {
      const options: CreateLogEntryOptions = {
        owner: new User(Users, ownerData[0]),
        entryTime: {
          date: '2024-03-28T13:45:00',
          timezone: 'Europe/Amsterdam',
        },
        site: siteFactory.createDiveSite(diveSiteData[2]),
        duration: 52,
      };

      const entry = await service.createLogEntry(options);
      expect(entry.id).toBeDefined();
      expect(entry.owner).toEqual({
        userId: ownerData[0].id,
        username: ownerData[0].username,
        memberSince: ownerData[0].memberSince,
        logBookSharing: ownerData[0].logBookSharing,
        name: ownerData[0].name,
        location: ownerData[0].location,
        avatar: ownerData[0].avatar,
      });
      expect(entry.entryTime).toEqual({
        date: '2024-03-28T13:45:00',
        timezone: 'Europe/Amsterdam',
      });
      expect(entry.duration).toEqual(options.duration);
      expect(entry.site?.id).toEqual(diveSiteData[2].id);

      const saved = await Entries.findOneOrFail({
        where: { id: entry.id },
        relations: ['owner', 'site'],
      });
      expect(saved.entryTime).toEqual(entry.entryTime.date);
      expect(saved.timezone).toEqual(entry.entryTime.timezone);
      expect(saved.duration).toEqual(options.duration);
      expect(saved.owner.id).toEqual(ownerData[0].id);
      expect(saved.timestamp).toEqual(new Date('2024-03-28T12:45:00.000Z'));
      expect(saved.site?.id).toEqual(diveSiteData[2].id);
    });
  });

  describe('when retrieving a single log entry', () => {
    it('will return the requested log entry', async () => {
      const data = logEntryData[1];
      data.site = diveSiteData[5];
      await Entries.save(data);
      await EntriesAir.save(
        data.air!.map((tank) => ({
          ...tank,
          logEntry: { id: data.id } as LogEntryEntity,
        })),
      );
      const result = (await service.getLogEntry(data.id))!;

      expect(result).toBeDefined();
      expect(result.id).toEqual(data.id);
      expect(result.logNumber).toEqual(data.logNumber);
      expect(result.bottomTime).toEqual(data.bottomTime);
      expect(result.duration).toEqual(data.duration);
      expect(result.maxDepth).toEqual({
        depth: data.maxDepth!,
        unit: data.maxDepthUnit!,
      });
      expect(result.notes).toEqual(data.notes);
      expect(result.entryTime).toEqual({
        date: data.entryTime,
        timezone: data.timezone,
      });
      expect(result.owner).toEqual({
        userId: data.owner.id,
        username: data.owner.username,
        memberSince: data.owner.memberSince,
        logBookSharing: data.owner.logBookSharing,
        name: data.owner.name,
        location: data.owner.location,
        avatar: data.owner.avatar,
      });
      expect(result.site?.name).toEqual(diveSiteData[5].name);
      expect(result.air).toEqual(data.air?.map(LogEntryAirUtils.entityToDTO));
    });

    it('will return undefined if the log entry does not exist', async () => {
      const result = await service.getLogEntry(
        '02658f6f-92e5-468d-baee-198bbf152044',
      );
      expect(result).toBeUndefined();
    });

    it('will retrieve a log entry belonging to a specific user', async () => {
      const data = logEntryData[1];
      await Entries.save(data);
      await EntriesAir.save(
        data.air!.map((tank) => ({
          ...tank,
          logEntry: { id: data.id } as LogEntryEntity,
        })),
      );
      const result = (await service.getLogEntry(data.id, ownerData[1].id))!;

      expect(result).toBeDefined();
      expect(result.id).toEqual(data.id);
      expect(result.logNumber).toEqual(data.logNumber);
      expect(result.bottomTime).toEqual(data.bottomTime);
      expect(result.duration).toEqual(data.duration);
      expect(result.maxDepth).toEqual({
        depth: data.maxDepth!,
        unit: data.maxDepthUnit!,
      });
      expect(result.notes).toEqual(data.notes);
      expect(result.entryTime).toEqual({
        date: data.entryTime,
        timezone: data.timezone,
      });
      expect(result.owner).toEqual({
        userId: data.owner.id,
        username: data.owner.username,
        memberSince: data.owner.memberSince,
        logBookSharing: data.owner.logBookSharing,
        name: data.owner.name,
        location: data.owner.location,
        avatar: data.owner.avatar,
      });
      expect(result.air).toEqual(data.air?.map(LogEntryAirUtils.entityToDTO));
    });

    it('will return undefined if the indicated log entry does not belong to the specified user', async () => {
      const data = logEntryData[0];
      await Entries.save(data);
      const result = await service.getLogEntry(data.id, ownerData[1].id);
      expect(result).toBeUndefined();
    });
  });

  describe('when listing log entries', () => {
    beforeEach(async () => {
      await Entries.save(logEntryData);
      await EntriesAir.save(airData);
    });

    it('will perform a basic search', async () => {
      const results = await service.listLogEntries();

      expect(results.totalCount).toBe(logEntryData.length);
      expect(results.logEntries).toHaveLength(50);

      expect(
        results.logEntries.map((entry) => ({
          id: entry.id,
          entryTime: entry.entryTime,
          site: entry.site?.name,
          air: entry.air,
        })),
      ).toMatchSnapshot();
    });

    it('will perform a search with pagination', async () => {
      const results = await service.listLogEntries({ skip: 50, limit: 10 });

      expect(results.totalCount).toBe(logEntryData.length);
      expect(results.logEntries).toHaveLength(10);

      expect(
        results.logEntries.map((entry) => ({
          id: entry.id,
          entryTime: entry.entryTime,
          site: entry.site?.name,
        })),
      ).toMatchSnapshot();
    });

    [
      { sortBy: LogEntrySortBy.EntryTime, sortOrder: SortOrder.Ascending },
      { sortBy: LogEntrySortBy.EntryTime, sortOrder: SortOrder.Descending },
    ].forEach(({ sortBy, sortOrder }) => {
      it(`will sort log entries by "${sortBy}" in "${sortOrder}" order`, async () => {
        const results = await service.listLogEntries({
          sortBy,
          sortOrder,
          limit: 10,
        });

        expect(results.totalCount).toBe(logEntryData.length);
        expect(results.logEntries).toHaveLength(10);

        expect(
          results.logEntries.map((entry) => ({
            id: entry.id,
            entryTime: entry.entryTime,
            site: entry.site?.name,
          })),
        ).toMatchSnapshot();
      });
    });

    it('will perform a search for log entries belonging to a specific diver', async () => {
      const results = await service.listLogEntries({
        ownerId: ownerData[0].id,
        limit: 20,
      });

      expect(results.totalCount).toBe(75);
      expect(results.logEntries).toHaveLength(20);

      expect(
        results.logEntries.map((entry) => ({
          id: entry.id,
          owner: entry.owner.username,
          entryTime: entry.entryTime,
          site: entry.site?.name,
        })),
      ).toMatchSnapshot();
    });

    [
      {
        name: 'between a start date and end date',
        start: new Date('2023-09-01T00:00:00.000Z'),
        end: new Date('2023-10-01T00:00:00.000Z'),
        expectedTotal: 8,
        expectedLength: 8,
      },
      {
        name: 'after a start date',
        start: new Date('2023-09-01T00:00:00.000Z'),
        end: undefined,
        expectedTotal: 84,
        expectedLength: 15,
      },
      {
        name: 'before an end date',
        start: undefined,
        end: new Date('2023-10-01T00:00:00.000Z'),
        expectedTotal: 224,
        expectedLength: 15,
      },
    ].forEach(({ name, start, end, expectedTotal, expectedLength }) => {
      it(`will perform a search for log entries ${name}`, async () => {
        const results = await service.listLogEntries({
          startDate: start,
          endDate: end,
          limit: 15,
        });

        expect(results.totalCount).toBe(expectedTotal);
        expect(results.logEntries).toHaveLength(expectedLength);

        expect(
          results.logEntries.map((entry) => ({
            id: entry.id,
            entryTime: entry.entryTime,
            site: entry.site?.name,
          })),
        ).toMatchSnapshot();
      });
    });
  });

  describe('when determining the next available log number for a user', () => {
    it('will return the next available log number', async () => {
      const owner = ownerData[0];
      const entries = [
        createTestLogEntry(owner, { logNumber: 12 }),
        createTestLogEntry(owner, { logNumber: 56 }),
        createTestLogEntry(owner, { logNumber: 34 }),
        createTestLogEntry(owner, { logNumber: null }),
        createTestLogEntry(owner, { logNumber: 1 }),
        createTestLogEntry(ownerData[1], { logNumber: 999 }),
      ];
      entries[3].logNumber = null;
      await Entries.save(entries);
      await expect(service.getNextAvailableLogNumber(owner.id)).resolves.toBe(
        57,
      );
    });

    it('will return "1" as the next available log number if the user has no numbered logs', async () => {
      await expect(
        service.getNextAvailableLogNumber(ownerData[0].id),
      ).resolves.toBe(1);
    });
  });
});
