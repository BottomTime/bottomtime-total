import dayjs from 'dayjs';
import mockFetch from 'fetch-mock-jest';

import {
  CreateOrUpdateLogEntryParamsDTO,
  DepthUnit,
  ExposureSuit,
  LogEntry,
  LogEntryDTO,
  PressureUnit,
  TankMaterial,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '../../src';
import { Fetcher } from '../../src/client/fetcher';
import { BasicUser } from '../fixtures/users';

const timestamp = new Date('2024-04-30T20:48:16.436Z');
const PartialTestData: LogEntryDTO = {
  id: 'bf1d4299-0c0b-47d4-bde1-d51f3573139b',
  createdAt: new Date('2024-07-23T12:09:55Z'),
  timing: {
    entryTime: {
      date: dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      timezone: 'Pacific/Pohnpei',
    },
    duration: 45.5,
  },
  creator: BasicUser.profile,
};
const FullTestData: LogEntryDTO = {
  ...PartialTestData,
  conditions: {
    airTemperature: 80,
    surfaceTemperature: 78,
    bottomTemperature: 72,
    temperatureUnit: TemperatureUnit.Fahrenheit,
    chop: 2,
    current: 3,
    weather: 'Sunny',
    visibility: 4,
  },
  createdAt: new Date('2024-07-23T12:09:55Z'),
  updatedAt: new Date('2024-07-23T12:09:55Z'),
  site: {
    id: 'f0c5b4d4-2d1d-4b5d-8e7d-9b7a4d4b8f1d',
    createdOn: new Date('2024-07-23T12:09:55Z'),
    name: 'The Wreck of the RMS Titanic',
    location: 'Atlantic Ocean',
    creator: BasicUser.profile,
  },
  timing: {
    ...PartialTestData.timing,
    bottomTime: 40.2,
  },
  logNumber: 444,
  depths: {
    averageDepth: 55.3,
    maxDepth: 92.3,
    depthUnit: DepthUnit.Feet,
  },
  equipment: {
    weight: 10,
    weightUnit: WeightUnit.Pounds,
    weightCorrectness: WeightCorrectness.Good,
    trimCorrectness: TrimCorrectness.Good,
    exposureSuit: ExposureSuit.Wetsuit5mm,
    hood: true,
    gloves: true,
    boots: true,
    camera: true,
    torch: true,
    scooter: true,
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
  tags: ['wreck', 'deep', 'cold'],
};

describe('Log entry API client', () => {
  let client: Fetcher;
  let entry: LogEntry;

  beforeAll(() => {
    client = new Fetcher();
  });

  beforeEach(() => {
    entry = new LogEntry(client, { ...FullTestData });
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will return properties correctly', () => {
    expect(entry.id).toBe(FullTestData.id);
    expect(entry.conditions).toEqual(FullTestData.conditions);
    expect(entry.creator.userId).toBe(BasicUser.id);
    expect(entry.depths).toEqual(FullTestData.depths);
    expect(entry.equipment).toBe(FullTestData.equipment);
    expect(entry.site).toEqual(FullTestData.site);
    expect(entry.timing).toEqual(FullTestData.timing);
    expect(entry.updatedAt).toEqual(FullTestData.updatedAt);
  });

  it('will return missing properties as undefined', () => {
    entry = new LogEntry(client, { ...PartialTestData });
    expect(entry.timing.bottomTime).toBeUndefined();
    expect(entry.logNumber).toBeUndefined();
    expect(entry.depths).toEqual({});
    expect(entry.notes).toBeUndefined();
    expect(entry.conditions).toEqual({});
    expect(entry.equipment).toEqual({});
    expect(entry.site).toBeUndefined();
    expect(entry.tags).toBeUndefined();
    expect(entry.air).toBeUndefined();
  });

  it('will allow properties to be updated', () => {
    const newLogNumber = 555;
    const newBottomTime = 50.2;
    const newDuration = 60.5;
    const newMaxDepth = 95.3;
    const newDepthUnit = DepthUnit.Feet;
    const newNotes = 'Awesome dive!';
    const newEntryTime = {
      date: '2024-04-30T20:48:16',
      timezone: 'Pacific/Pohnpei',
    };
    const newWeather = 'Cloudy and chilly';
    const newExposureSuit = ExposureSuit.Drysuit;
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
    entry.timing.entryTime = newEntryTime;
    entry.timing.bottomTime = newBottomTime;
    entry.timing.duration = newDuration;
    entry.depths.maxDepth = newMaxDepth;
    entry.depths.depthUnit = newDepthUnit;
    entry.conditions.weather = newWeather;
    entry.equipment.exposureSuit = newExposureSuit;
    entry.notes = newNotes;
    entry.air = newAir;

    expect(entry.logNumber).toBe(newLogNumber);
    expect(entry.timing.entryTime).toEqual(newEntryTime);
    expect(entry.timing.bottomTime).toBe(newBottomTime);
    expect(entry.timing.duration).toBe(newDuration);
    expect(entry.equipment.exposureSuit).toBe(newExposureSuit);
    expect(entry.conditions.weather).toBe(newWeather);
    expect(entry.depths.maxDepth).toEqual(newMaxDepth);
    expect(entry.depths.depthUnit).toBe(newDepthUnit);
    expect(entry.notes).toBe(newNotes);
    expect(entry.air).toEqual(newAir);
  });

  it('will render correctly as JSON', () => {
    expect(entry.toJSON()).toEqual(FullTestData);
  });

  it('will save changes to the log entry', async () => {
    const options: CreateOrUpdateLogEntryParamsDTO = {
      timing: {
        duration: 50.5,
        entryTime: {
          date: '2024-04-30T20:48:16',
          timezone: 'Pacific/Pohnpei',
        },
        bottomTime: 50.2,
      },
      conditions: { ...FullTestData.conditions },
      logNumber: 555,
      depths: {
        ...FullTestData.depths,
        maxDepth: 95.3,
        depthUnit: DepthUnit.Feet,
      },
      notes: 'Awesome dive!',
      equipment: {
        ...FullTestData.equipment,
        weight: 5.2,
        weightUnit: WeightUnit.Pounds,
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
      tags: FullTestData.tags,
      site: FullTestData.site!.id,
    };

    entry.logNumber = options.logNumber;
    entry.timing.entryTime = options.timing.entryTime;
    entry.timing.bottomTime = options.timing.bottomTime;
    entry.timing.duration = options.timing.duration;
    entry.depths.maxDepth = options.depths!.maxDepth;
    entry.depths.depthUnit = options.depths!.depthUnit;
    entry.notes = options.notes;
    entry.equipment.weight = options.equipment!.weight;
    entry.equipment.weightUnit = options.equipment!.weightUnit;
    entry.air = options.air!;

    mockFetch.put(
      {
        url: `/api/users/${BasicUser.username}/logbook/${entry.id}`,
        body: options,
      },
      {
        status: 200,
        body: entry.toJSON(),
      },
    );
    await entry.save();
    expect(mockFetch.done()).toBe(true);
  });

  it('will delete a log entry', async () => {
    mockFetch.delete(
      `/api/users/${BasicUser.username}/logbook/${entry.id}`,
      204,
    );
    await entry.delete();
    expect(mockFetch.done()).toBe(true);
  });
});
