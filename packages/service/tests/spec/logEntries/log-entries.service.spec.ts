import { DepthUnit, LogEntrySortBy, SortOrder } from '@bottomtime/api';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import fs from 'fs/promises';
import { Repository } from 'typeorm';

import { LogEntryEntity, UserEntity } from '../../../src/data';
import {
  CreateLogEntryOptions,
  LogEntriesService,
} from '../../../src/logEntries';
import { dataSource } from '../../data-source';
import TestLogEntryData from '../../fixtures/log-entries.json';
import TestUserData from '../../fixtures/user-search-data.json';
import {
  createTestLogEntry,
  parseLogEntryJSON,
} from '../../utils/create-test-log-entry';
import { parseUserJSON } from '../../utils/create-test-user';

dayjs.extend(tz);
dayjs.extend(utc);

describe('Log entries service', () => {
  let Entries: Repository<LogEntryEntity>;
  let Users: Repository<UserEntity>;
  let service: LogEntriesService;

  let ownerData: UserEntity[];
  let logEntryData: LogEntryEntity[];

  beforeAll(() => {
    Entries = dataSource.getRepository(LogEntryEntity);
    Users = dataSource.getRepository(UserEntity);

    service = new LogEntriesService(Users, Entries);

    ownerData = TestUserData.slice(0, 4).map((data) => parseUserJSON(data));
    logEntryData = TestLogEntryData.map((data, i) =>
      parseLogEntryJSON(data, ownerData[i % ownerData.length]),
    );
  });

  beforeEach(async () => {
    await Users.save(ownerData);
  });

  it.skip('will generate some sweet, sweet test data', async () => {
    const data = new Array<LogEntryEntity>(300);
    for (let i = 0; i < data.length; i++) {
      data[i] = createTestLogEntry(ownerData[i % 4]);
      data[i].owner = { id: data[i].owner.id } as UserEntity;
    }

    await fs.writeFile(
      './log-entries.json',
      JSON.stringify(data, null, 2),
      'utf-8',
    );
  });

  describe('when creating a new log entry', () => {
    it('will create a new log entry with minimal options', async () => {
      const options: CreateLogEntryOptions = {
        ownerId: ownerData[0].id,
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
        relations: ['owner'],
      });
      expect(saved.entryTime).toEqual(entry.entryTime.date);
      expect(saved.timezone).toEqual(entry.entryTime.timezone);
      expect(saved.duration).toEqual(options.duration);
      expect(saved.owner.id).toEqual(ownerData[0].id);
      expect(saved.timestamp).toEqual(new Date('2024-03-28T12:45:00.000Z'));
    });

    it('will create a new log entry with all options', async () => {
      const options: CreateLogEntryOptions = {
        ownerId: ownerData[0].id,
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
      };

      const entry = await service.createLogEntry(options);
      expect(entry.id).toBeDefined();
      expect(entry.logNumber).toEqual(options.logNumber);
      expect(entry.owner).toEqual({
        userId: ownerData[0].id,
        username: ownerData[0].username,
        memberSince: ownerData[0].memberSince,
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

      const saved = await Entries.findOneOrFail({
        where: { id: entry.id },
        relations: ['owner'],
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
    });
  });

  describe('when retrieving a single log entry', () => {
    it('will return the requested log entry', async () => {
      const data = logEntryData[0];
      await Entries.save(data);
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
        name: data.owner.name,
        location: data.owner.location,
        avatar: data.owner.avatar,
      });
    });

    it('will return undefined if the log entry does not exist', async () => {
      const result = await service.getLogEntry(
        '02658f6f-92e5-468d-baee-198bbf152044',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('when listing log entries', () => {
    beforeEach(async () => {
      await Entries.save(logEntryData);
    });

    it('will perform a basic search', async () => {
      const results = await service.listLogEntries();

      expect(results.totalCount).toBe(logEntryData.length);
      expect(results.logEntries).toHaveLength(50);

      expect(
        results.logEntries.map((entry) => ({
          id: entry.id,
          entryTime: entry.entryTime,
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
          })),
        ).toMatchSnapshot();
      });
    });

    it('will perform a search for log entries belonging to a specific diver', async () => {
      const results = await service.listLogEntries({
        owner: ownerData[0].id,
        limit: 20,
      });

      expect(results.totalCount).toBe(75);
      expect(results.logEntries).toHaveLength(20);

      expect(
        results.logEntries.map((entry) => ({
          id: entry.id,
          owner: entry.owner.username,
          entryTime: entry.entryTime,
        })),
      ).toMatchSnapshot();
    });

    [
      {
        start: new Date('2023-09-01T00:00:00.000Z'),
        end: new Date('2023-10-01T00:00:00.000Z'),
        expectedTotal: 8,
        expectedLength: 8,
      },
      {
        start: new Date('2023-09-01T00:00:00.000Z'),
        end: undefined,
        expectedTotal: 69,
        expectedLength: 15,
      },
      {
        start: undefined,
        end: new Date('2023-10-01T00:00:00.000Z'),
        expectedTotal: 239,
        expectedLength: 15,
      },
    ].forEach(({ start, end, expectedTotal, expectedLength }) => {
      it(`will perform a search for log entries between dates ${
        start ? dayjs(start).format('YYYY-MM-DD') : '<ANY>'
      } and ${end ? dayjs(end).format('YYYY-MM-DD') : '<ANY>'}`, async () => {
        const results = await service.listLogEntries({
          dateRange: { start, end },
          limit: 15,
        });

        expect(results.totalCount).toBe(expectedTotal);
        expect(results.logEntries).toHaveLength(expectedLength);

        expect(
          results.logEntries.map((entry) => ({
            id: entry.id,
            entryTime: entry.entryTime,
          })),
        ).toMatchSnapshot();
      });
    });
  });
});
