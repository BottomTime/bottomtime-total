import { DepthUnit } from '@bottomtime/api';

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
    // expect(logEntry.creator).toBe(user);
    // expect(logEntry.timestamp).toBe(data.timestamp);
    expect(logEntry.entryTime).toEqual(new Date('2021-01-01T12:34:56'));
    expect(logEntry.timezone).toBe(data.timezone);
    expect(logEntry.bottomTime).toBe(data.bottomTime);
    expect(logEntry.duration).toBe(data.duration);
    expect(logEntry.maxDepth).toBe(data.maxDepth);
    expect(logEntry.maxDepthUnit).toBe(data.maxDepthUnit);
    expect(logEntry.notes).toBe(data.notes);
  });
});
