import { DepthUnit } from '@bottomtime/api';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Repository } from 'typeorm';

import { LogEntryEntity, UserEntity } from '../../../src/data';
import { LogEntry } from '../../../src/logEntries';
import { dataSource } from '../../data-source';
import { createTestLogEntry } from '../../utils/create-test-log-entry';
import { createTestUser } from '../../utils/create-test-user';

const CreatorData: Partial<UserEntity> = {
  id: '5ac8b2c0-c9b7-4293-989c-13c2aa4e4dd5',
  memberSince: new Date('2021-01-01'),
  username: 'Diver.Dan',
  avatar:
    'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/873.jpg',
  name: 'Dan Diver',
  location: 'Underwater',
};

const TestLogEntryData: Partial<LogEntryEntity> = {
  id: 'd02158b5-bcee-4923-93bb-35b5853b1e5d',
  logNumber: 42,

  timestamp: new Date('2021-01-01T04:34:56'),
  entryTime: '2021-01-01T12:34:56',
  timezone: 'America/Los_Angeles',

  bottomTime: 45,
  duration: 50,
  maxDepth: 30,
  maxDepthUnit: DepthUnit.Feet,

  notes: 'This was a great dive!',
};

dayjs.extend(tz);
dayjs.extend(utc);

describe('Log Entry class', () => {
  let Users: Repository<UserEntity>;
  let Entries: Repository<LogEntryEntity>;

  let user: UserEntity;
  let data: LogEntryEntity;
  let logEntry: LogEntry;

  beforeAll(() => {
    Entries = dataSource.getRepository(LogEntryEntity);
    Users = dataSource.getRepository(UserEntity);
    user = createTestUser(CreatorData);
  });

  beforeEach(async () => {
    data = createTestLogEntry(user, TestLogEntryData);
    logEntry = new LogEntry(Entries, data);

    await Users.save(user);
  });

  it('will return properties correctly', () => {
    expect(logEntry.id).toBe(data.id);
    expect(logEntry.logNumber).toBe(data.logNumber);
    expect(logEntry.owner).toEqual({
      userId: CreatorData.id,
      memberSince: CreatorData.memberSince,
      username: CreatorData.username,
      avatar: CreatorData.avatar,
      name: CreatorData.name,
      location: CreatorData.location,
    });
    expect(logEntry.entryTime).toEqual({
      date: '2021-01-01T12:34:56',
      timezone: data.timezone,
    });
    expect(logEntry.bottomTime).toBe(data.bottomTime);
    expect(logEntry.duration).toBe(data.duration);
    expect(logEntry.maxDepth).toEqual({
      depth: data.maxDepth,
      unit: data.maxDepthUnit,
    });
    expect(logEntry.notes).toBe(data.notes);
  });

  it('will update properties correctly', () => {
    const newLogNumber = 43;
    const newEntryTime = '2021-01-01T13:34:56';
    const newTimezone = 'America/Toronto';
    const newBottomTime = 50;
    const newDuration = 55;
    const newMaxDepth = 35;
    const newMaxDepthUnit = DepthUnit.Meters;
    const newNotes = 'This was an even better dive!';

    logEntry.logNumber = newLogNumber;
    logEntry.entryTime = {
      date: newEntryTime,
      timezone: newTimezone,
    };
    logEntry.bottomTime = newBottomTime;
    logEntry.duration = newDuration;
    logEntry.maxDepth = {
      depth: newMaxDepth,
      unit: newMaxDepthUnit,
    };
    logEntry.notes = newNotes;

    expect(logEntry.logNumber).toBe(newLogNumber);
    expect(logEntry.entryTime).toEqual({
      date: newEntryTime,
      timezone: newTimezone,
    });
    expect(logEntry.bottomTime).toBe(newBottomTime);
    expect(logEntry.duration).toBe(newDuration);
    expect(logEntry.maxDepth).toEqual({
      depth: newMaxDepth,
      unit: newMaxDepthUnit,
    });
    expect(logEntry.notes).toBe(newNotes);
  });

  it('will allow optional properties to be set to undefined', () => {
    logEntry.logNumber = undefined;
    logEntry.bottomTime = undefined;
    logEntry.duration = undefined;
    logEntry.maxDepth = undefined;
    logEntry.notes = undefined;

    expect(logEntry.logNumber).toBeUndefined();
    expect(logEntry.bottomTime).toBeUndefined();
    expect(logEntry.duration).toBeUndefined();
    expect(logEntry.maxDepth).toBeUndefined();
    expect(logEntry.notes).toBeUndefined();
  });

  it('will render a JSON object correctly', () => {
    expect(logEntry.toJSON()).toEqual({
      id: data.id,
      logNumber: data.logNumber,
      creator: {
        userId: CreatorData.id,
        memberSince: CreatorData.memberSince,
        username: CreatorData.username,
        avatar: CreatorData.avatar,
        name: CreatorData.name,
        location: CreatorData.location,
      },
      entryTime: {
        date: '2021-01-01T12:34:56',
        timezone: data.timezone,
      },
      bottomTime: data.bottomTime,
      duration: data.duration,
      maxDepth: {
        depth: data.maxDepth,
        unit: data.maxDepthUnit,
      },
      notes: data.notes,
    });
  });

  it('will save a new log entry to the database', async () => {
    await logEntry.save();

    const saved = await Entries.findOneOrFail({
      where: { id: logEntry.id },
      relations: ['owner'],
    });
    expect(saved.id).toBe(logEntry.id);
    expect(saved.logNumber).toBe(logEntry.logNumber);
    expect(saved.owner.id).toEqual(user.id);
    expect(saved.timestamp).toEqual(data.timestamp);
    expect(saved.entryTime).toBe(data.entryTime);
    expect(saved.timezone).toBe(data.timezone);
    expect(saved.bottomTime).toBe(logEntry.bottomTime);
    expect(saved.duration).toBe(logEntry.duration);
    expect(saved.maxDepth).toBe(logEntry.maxDepth!.depth);
    expect(saved.maxDepthUnit).toBe(logEntry.maxDepth!.unit);
    expect(saved.notes).toBe(logEntry.notes);
  });

  it('will update an existing log entry in the database', async () => {
    await Entries.save(data);

    logEntry.logNumber = 44;
    logEntry.entryTime = {
      date: '2024-05-08T08:34:56',
      timezone: 'Asia/Singapore',
    };
    logEntry.bottomTime = 55;
    logEntry.duration = 60;
    logEntry.maxDepth = {
      depth: 40,
      unit: DepthUnit.Feet,
    };
    logEntry.notes = 'This was the best dive yet!';

    await logEntry.save();

    const saved = await Entries.findOneOrFail({
      where: { id: logEntry.id },
      relations: ['owner'],
    });
    expect(saved.id).toBe(logEntry.id);
    expect(saved.logNumber).toBe(logEntry.logNumber);
    expect(saved.owner.id).toEqual(user.id);
    expect(saved.entryTime).toBe('2024-05-08T08:34:56');
    expect(saved.timezone).toBe('Asia/Singapore');
    expect(saved.timestamp).toEqual(new Date('2024-05-08T00:34:56.000Z'));
    expect(saved.bottomTime).toBe(logEntry.bottomTime);
    expect(saved.duration).toBe(logEntry.duration);
    expect(saved.maxDepth).toBe(logEntry.maxDepth!.depth);
    expect(saved.maxDepthUnit).toBe(logEntry.maxDepth!.unit);
    expect(saved.notes).toBe(logEntry.notes);
  });

  it('will delete a log entry from the database', async () => {
    await Entries.save(data);
    await logEntry.delete();
    const savedEntry = await Entries.findOneBy({ id: logEntry.id });
    expect(savedEntry).toBeNull();
  });
});
