import axios, { AxiosInstance } from 'axios';
import dayjs from 'dayjs';

import { DepthUnit, LogEntry, LogEntryDTO } from '../../src';
import { BasicUser } from '../fixtures/users';

const timestamp = new Date('2024-04-30T20:48:16.436Z');
const PartialTestData: LogEntryDTO = {
  id: 'bf1d4299-0c0b-47d4-bde1-d51f3573139b',
  entryTime: {
    date: dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
    timezone: 'Pacific/Pohnpei',
  },
  creator: BasicUser.profile,
  duration: 45.5,
};
const FullTestData: LogEntryDTO = {
  ...PartialTestData,
  bottomTime: 40.2,
  logNumber: 444,
  maxDepth: {
    depth: 92.3,
    unit: DepthUnit.Feet,
  },
  notes: 'Sick shipwreck!',
};

describe('Log entry API client', () => {
  let client: AxiosInstance;
  let entry: LogEntry;

  beforeAll(() => {
    client = axios.create();
  });

  beforeEach(() => {
    entry = new LogEntry(client, { ...FullTestData });
  });

  it('will return properties correctly', () => {
    expect(entry.id).toBe(FullTestData.id);
    expect(entry.entryTime).toEqual(FullTestData.entryTime);
    expect(entry.creator.userId).toBe(BasicUser.id);
    expect(entry.duration).toBe(FullTestData.duration);
    expect(entry.bottomTime).toBe(FullTestData.bottomTime);
    expect(entry.logNumber).toBe(FullTestData.logNumber);
    expect(entry.maxDepth).toEqual(FullTestData.maxDepth);
    expect(entry.notes).toBe(FullTestData.notes);
  });

  it('will return missing properties as undefined', () => {
    entry = new LogEntry(client, { ...PartialTestData });
    expect(entry.bottomTime).toBeUndefined();
    expect(entry.logNumber).toBeUndefined();
    expect(entry.maxDepth).toBeUndefined();
    expect(entry.notes).toBeUndefined();
  });

  it('will allow properties to be updated', () => {
    const newLogNumber = 555;
    const newBottomTime = 50.2;
    const newDuration = 60.5;
    const newMaxDepth = { depth: 95.3, unit: DepthUnit.Feet };
    const newNotes = 'Awesome dive!';
    const newEntryTime = {
      date: '2024-04-30T20:48:16',
      timezone: 'Pacific/Pohnpei',
    };

    entry.logNumber = newLogNumber;
    entry.entryTime = newEntryTime;
    entry.bottomTime = newBottomTime;
    entry.duration = newDuration;
    entry.maxDepth = newMaxDepth;
    entry.notes = newNotes;

    expect(entry.logNumber).toBe(newLogNumber);
    expect(entry.entryTime).toEqual(newEntryTime);
    expect(entry.bottomTime).toBe(newBottomTime);
    expect(entry.duration).toBe(newDuration);
    expect(entry.maxDepth).toEqual(newMaxDepth);
    expect(entry.notes).toBe(newNotes);
  });

  it('will render correctly as JSON', () => {
    expect(entry.toJSON()).toEqual(FullTestData);
  });
});
