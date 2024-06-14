import axios, { AxiosInstance } from 'axios';
import dayjs from 'dayjs';
import nock, { Scope } from 'nock';

import {
  CreateOrUpdateLogEntryParamsDTO,
  DepthUnit,
  LogEntry,
  LogEntryDTO,
  PressureUnit,
  TankMaterial,
  WeightUnit,
} from '../../src';
import { createScope } from '../fixtures/nock';
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
  weights: {
    weight: 10,
    unit: WeightUnit.Pounds,
  },
  notes: 'Sick shipwreck!',
  air: [
    {
      name: 'lean photographer',
      material: TankMaterial.Aluminum,
      workingPressure: 300,
      volume: 4,
      count: 1,
      startPressure: 227.7898846170865,
      endPressure: 69.807624156354,
      pressureUnit: PressureUnit.Bar,
      o2Percent: 27.6,
    },
  ],
};

describe('Log entry API client', () => {
  let client: AxiosInstance;
  let scope: Scope;
  let entry: LogEntry;

  beforeAll(() => {
    client = axios.create();
    scope = createScope();
  });

  beforeEach(() => {
    entry = new LogEntry(client, { ...FullTestData });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
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
    expect(entry.air).toEqual(FullTestData.air);
    expect(entry.weights).toEqual(FullTestData.weights);
  });

  it('will return missing properties as undefined', () => {
    entry = new LogEntry(client, { ...PartialTestData });
    expect(entry.bottomTime).toBeUndefined();
    expect(entry.logNumber).toBeUndefined();
    expect(entry.maxDepth).toBeUndefined();
    expect(entry.notes).toBeUndefined();
    expect(entry.air).toBeUndefined();
    expect(entry.weights).toBeUndefined();
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
    const newAir = [
      {
        name: 'robust spokesman',
        material: TankMaterial.Steel,
        workingPressure: 207,
        volume: 4,
        count: 1,
        startPressure: 213.0432935175486,
        endPressure: 62.67623910983093,
        pressureUnit: PressureUnit.Bar,
        o2Percent: 21.6,
      },
    ];

    entry.logNumber = newLogNumber;
    entry.entryTime = newEntryTime;
    entry.bottomTime = newBottomTime;
    entry.duration = newDuration;
    entry.maxDepth = newMaxDepth;
    entry.notes = newNotes;
    entry.air = newAir;

    expect(entry.logNumber).toBe(newLogNumber);
    expect(entry.entryTime).toEqual(newEntryTime);
    expect(entry.bottomTime).toBe(newBottomTime);
    expect(entry.duration).toBe(newDuration);
    expect(entry.maxDepth).toEqual(newMaxDepth);
    expect(entry.notes).toBe(newNotes);
    expect(entry.air).toEqual(newAir);
  });

  it('will render correctly as JSON', () => {
    expect(entry.toJSON()).toEqual(FullTestData);
  });

  it('will save changes to the log entry', async () => {
    const options: CreateOrUpdateLogEntryParamsDTO = {
      duration: 50.5,
      entryTime: {
        date: '2024-04-30T20:48:16',
        timezone: 'Pacific/Pohnpei',
      },
      bottomTime: 50.2,
      logNumber: 555,
      maxDepth: { depth: 95.3, unit: DepthUnit.Feet },
      notes: 'Awesome dive!',
      weights: {
        weight: 5.2,
        unit: WeightUnit.Pounds,
      },
      air: [
        {
          name: 'robust spokesman',
          material: TankMaterial.Steel,
          workingPressure: 207,
          volume: 4,
          count: 1,
          startPressure: 213.0432935175486,
          endPressure: 62.67623910983093,
          pressureUnit: PressureUnit.Bar,
          o2Percent: 21.6,
        },
      ],
    };

    entry.logNumber = options.logNumber;
    entry.entryTime = options.entryTime;
    entry.bottomTime = options.bottomTime;
    entry.duration = options.duration;
    entry.maxDepth = options.maxDepth;
    entry.notes = options.notes;
    entry.weights = options.weights;
    entry.air = options.air!;

    scope
      .put(`/api/users/${BasicUser.username}/logbook/${entry.id}`, options)
      .reply(200, entry.toJSON());
    await entry.save();
    expect(scope.isDone()).toBe(true);
  });

  it('will delete a log entry', async () => {
    scope
      .delete(`/api/users/${BasicUser.username}/logbook/${entry.id}`)
      .reply(204);
    await entry.delete();
    expect(scope.isDone()).toBe(true);
  });
});
