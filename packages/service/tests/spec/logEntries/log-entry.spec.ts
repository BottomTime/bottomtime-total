import {
  DepthUnit,
  ExposureSuit,
  LogBookSharing,
  LogEntryAirDTO,
  PressureUnit,
  TankMaterial,
  TemperatureUnit,
  TrimCorrectness,
  WaterType,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { from, map } from 'rxjs';
import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import {
  DiveSiteEntity,
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntrySampleEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSiteFactory } from '../../../src/diveSites/dive-site-factory';
import { LogEntry } from '../../../src/logEntries';
import { LogEntryAirUtils } from '../../../src/logEntries/log-entry-air-utils';
import { LogEntrySampleUtils } from '../../../src/logEntries/log-entry-sample-utils';
import { OperatorFactory } from '../../../src/operators';
import { dataSource } from '../../data-source';
import TestSamples from '../../fixtures/dive-profile.json';
import {
  createDiveSiteFactory,
  createOperatorFactory,
  createTestDiveSite,
  createTestLogEntry,
  createTestlogEntryAir,
} from '../../utils';
import { createTestUser } from '../../utils/create-test-user';

const CreatorData: Partial<UserEntity> = {
  id: '5ac8b2c0-c9b7-4293-989c-13c2aa4e4dd5',
  memberSince: new Date('2021-01-01'),
  username: 'Diver.Dan',
  avatar:
    'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/873.jpg',
  logBookSharing: LogBookSharing.FriendsOnly,
  name: 'Dan Diver',
  location: 'Underwater',
};

const TestSiteData: DiveSiteEntity = {
  id: 'b4afa428-eeb8-4bb3-935d-f124cc6c27f1',
  averageDifficulty: 2.2,
  averageRating: 3.8,
  createdOn: new Date('2024-05-21T19:46:14.342Z'),
  creator: createTestUser(CreatorData),
  depth: 21.8,
  depthUnit: DepthUnit.Meters,
  description: 'A wet dive site',
  directions: 'Drive, and then take a boat',
  freeToDive: true,
  gps: {
    coordinates: [1.0, 1.0],
    type: 'Point',
  },
  location: 'Ocean',
  name: 'Dive Site of Awesomeness',
  shoreAccess: false,
  waterType: WaterType.Salt,
  updatedOn: new Date('2024-05-21T19:46:14.342Z'),
};

const TestLogEntryData: Partial<LogEntryEntity> = {
  id: 'd02158b5-bcee-4923-93bb-35b5853b1e5d',
  createdAt: new Date('2014-10-27T01:35:36.540Z'),
  logNumber: 42,

  entryTime: new Date('2021-01-01T12:34:56'),
  timezone: 'America/Los_Angeles',

  bottomTime: 2700,
  duration: 3000,
  averageDepth: 21.2,
  maxDepth: 30,
  depthUnit: DepthUnit.Feet,

  air: [
    {
      id: 'cf3d9ae2-8ebc-4941-b6a8-4ce1c1fa475c',
      count: 2,
      ordinal: 0,
      material: TankMaterial.Steel,
      name: 'HP100',
      workingPressure: 3442,
      volume: 100,
      startPressure: 3000,
      endPressure: 500,
      pressureUnit: PressureUnit.PSI,
      o2Percent: 0.21,
      hePercent: 0.4,
    },
    {
      id: 'ad4de203-a3c6-49e0-8bb8-c6b2851ee1f6',
      count: 1,
      ordinal: 1,
      material: TankMaterial.Aluminum,
      name: 'AL80',
      workingPressure: 3000,
      volume: 80,
      startPressure: 3000,
      endPressure: 500,
      pressureUnit: PressureUnit.PSI,
      o2Percent: 0.32,
      hePercent: 0.0,
    },
    {
      id: '8a65be87-303c-4aa8-8031-f3c3b8e074e3',
      count: 1,
      ordinal: 2,
      material: TankMaterial.Aluminum,
      name: 'AL80',
      workingPressure: 3000,
      volume: 80,
      startPressure: 2800,
      endPressure: 1200,
      pressureUnit: PressureUnit.PSI,
      o2Percent: 0.5,
      hePercent: null,
    },
  ],

  weight: 5.5,
  weightUnit: WeightUnit.Pounds,
  weightCorrectness: WeightCorrectness.Good,
  trimCorrectness: TrimCorrectness.KneesDown,

  exposureSuit: ExposureSuit.Wetsuit7mm,
  hood: true,
  gloves: true,
  boots: true,
  camera: true,
  torch: false,
  scooter: false,

  airTemperature: 22.5,
  surfaceTemperature: 12.8,
  bottomTemperature: 7.3,
  temperatureUnit: TemperatureUnit.Celsius,
  chop: 2.5,
  current: 1.5,
  weather: 'Sunny',
  visibility: 4.2,

  notes: 'This was a great dive!',
  tags: [],
  rating: 3.2,
};

dayjs.extend(tz);
dayjs.extend(utc);

describe('Log Entry class', () => {
  let Users: Repository<UserEntity>;
  let Entries: Repository<LogEntryEntity>;
  let EntriesAir: Repository<LogEntryAirEntity>;
  let EntrySamples: Repository<LogEntrySampleEntity>;
  let Sites: Repository<DiveSiteEntity>;

  let user: UserEntity;
  let data: LogEntryEntity;
  let logEntry: LogEntry;
  let diveSite: DiveSiteEntity;

  let siteFactory: DiveSiteFactory;
  let operatorFactory: OperatorFactory;

  beforeAll(() => {
    Entries = dataSource.getRepository(LogEntryEntity);
    EntriesAir = dataSource.getRepository(LogEntryAirEntity);
    EntrySamples = dataSource.getRepository(LogEntrySampleEntity);
    Users = dataSource.getRepository(UserEntity);
    Sites = dataSource.getRepository(DiveSiteEntity);

    user = createTestUser(CreatorData);
    diveSite = createTestDiveSite(user, TestSiteData);

    siteFactory = createDiveSiteFactory();
    operatorFactory = createOperatorFactory();
  });

  beforeEach(async () => {
    data = createTestLogEntry(user, TestLogEntryData);
    logEntry = new LogEntry(
      Entries,
      EntriesAir,
      EntrySamples,
      siteFactory,
      operatorFactory,
      data,
    );

    await Users.save(user);
    await Sites.save(diveSite);
  });

  it('will return properties correctly', () => {
    data.site = diveSite;

    expect(logEntry.id).toBe(data.id);
    expect(logEntry.logNumber).toBe(data.logNumber);
    expect(logEntry.owner).toMatchSnapshot();
    expect(logEntry.conditions).toMatchSnapshot();
    expect(logEntry.depths).toMatchSnapshot();
    expect(logEntry.equipment).toMatchSnapshot();

    expect(logEntry.timing).toMatchSnapshot();

    expect(logEntry.notes).toBe(data.notes);
    expect(logEntry.site?.toEntity()).toEqual(diveSite);
  });

  it('will update properties correctly', () => {
    const newLogNumber = 43;

    const newEntryTime = new Date('2021-01-01T13:34:56');
    const newTimezone = 'America/Toronto';
    const newBottomTime = 50;
    const newDuration = 55;

    const newAirTemp = 77;
    const newSurfaceTemp = 52;
    const newBottomTemp = 37;
    const newTempUnit = TemperatureUnit.Fahrenheit;

    const newChop = 3;
    const newCurrent = 2.6;
    const newWeather = 'Chilly';
    const newVisibility = 6.3;

    const newAverageDepth = 27.5;
    const newMaxDepth = 35;
    const newDepthUnit = DepthUnit.Meters;

    const newWeight = 3.3;
    const newWeightUnit = WeightUnit.Kilograms;
    const newWeightCorrectness = WeightCorrectness.Under;
    const newTrimCorrectness = TrimCorrectness.HeadDown;
    const newExposureSuit = ExposureSuit.Drysuit;
    const newHood = false;
    const newGloves = false;
    const newBoots = false;
    const newCamera = false;
    const newTorch = true;
    const newScooter = true;

    const newNotes = 'This was an even better dive!';

    logEntry.logNumber = newLogNumber;
    logEntry.timing.entryTime = newEntryTime;
    logEntry.timing.timezone = newTimezone;
    logEntry.timing.bottomTime = newBottomTime;
    logEntry.timing.duration = newDuration;

    logEntry.conditions.airTemperature = newAirTemp;
    logEntry.conditions.surfaceTemperature = newSurfaceTemp;
    logEntry.conditions.bottomTemperature = newBottomTemp;
    logEntry.conditions.temperatureUnit = newTempUnit;
    logEntry.conditions.chop = newChop;
    logEntry.conditions.current = newCurrent;
    logEntry.conditions.weather = newWeather;
    logEntry.conditions.visibility = newVisibility;

    logEntry.depths.averageDepth = newAverageDepth;
    logEntry.depths.maxDepth = newMaxDepth;
    logEntry.depths.depthUnit = newDepthUnit;

    logEntry.equipment.weight = newWeight;
    logEntry.equipment.weightUnit = newWeightUnit;
    logEntry.equipment.weightCorrectness = newWeightCorrectness;
    logEntry.equipment.trimCorrectness = newTrimCorrectness;
    logEntry.equipment.exposureSuit = newExposureSuit;
    logEntry.equipment.hood = newHood;
    logEntry.equipment.gloves = newGloves;
    logEntry.equipment.boots = newBoots;
    logEntry.equipment.camera = newCamera;
    logEntry.equipment.torch = newTorch;
    logEntry.equipment.scooter = newScooter;

    logEntry.notes = newNotes;

    expect(logEntry.logNumber).toBe(newLogNumber);
    expect(logEntry.timing.entryTime).toEqual(newEntryTime);
    expect(logEntry.timing.timezone).toBe(newTimezone);
    expect(logEntry.timing.bottomTime).toBe(newBottomTime);
    expect(logEntry.timing.duration).toBe(newDuration);

    expect(logEntry.conditions.airTemperature).toBe(newAirTemp);
    expect(logEntry.conditions.surfaceTemperature).toBe(newSurfaceTemp);
    expect(logEntry.conditions.bottomTemperature).toBe(newBottomTemp);
    expect(logEntry.conditions.temperatureUnit).toBe(newTempUnit);
    expect(logEntry.conditions.chop).toBe(newChop);
    expect(logEntry.conditions.current).toBe(newCurrent);
    expect(logEntry.conditions.weather).toBe(newWeather);
    expect(logEntry.conditions.visibility).toBe(newVisibility);

    expect(logEntry.depths.averageDepth).toBe(newAverageDepth);
    expect(logEntry.depths.maxDepth).toBe(newMaxDepth);
    expect(logEntry.depths.depthUnit).toBe(newDepthUnit);

    expect(logEntry.notes).toBe(newNotes);
  });

  it('will set site property', async () => {
    const site = siteFactory.createDiveSite(diveSite);
    logEntry.site = site;
    expect(logEntry.site.toEntity()).toEqual(diveSite);
  });

  it('will unset site property', async () => {
    data.site = diveSite;
    logEntry.site = undefined;
    expect(logEntry.site).toBeUndefined();
    expect(data.site).toBeNull();
  });

  it('will render a JSON object correctly', () => {
    data.site = diveSite;
    expect(logEntry.toJSON()).toMatchSnapshot();
  });

  it('will save a new log entry to the database', async () => {
    data.site = diveSite;
    await logEntry.save();

    const saved = await Entries.findOneOrFail({
      where: { id: logEntry.id },
      relations: ['owner', 'site'],
    });
    expect(saved.id).toBe(logEntry.id);
    expect(saved.logNumber).toBe(logEntry.logNumber);
    expect(saved.owner.id).toEqual(user.id);
    expect(saved.entryTime).toEqual(data.entryTime);
    expect(saved.timezone).toBe(data.timezone);
    expect(saved.bottomTime).toBe(data.bottomTime);
    expect(saved.duration).toBe(data.duration);
    expect(saved.averageDepth).toBe(data.averageDepth);
    expect(saved.maxDepth).toBe(data.maxDepth);
    expect(saved.depthUnit).toBe(data.depthUnit);
    expect(saved.weight).toBe(data.weight);
    expect(saved.weightUnit).toBe(data.weightUnit);
    expect(saved.weightCorrectness).toBe(data.weightCorrectness);
    expect(saved.trimCorrectness).toBe(data.trimCorrectness);
    expect(saved.exposureSuit).toBe(data.exposureSuit);
    expect(saved.hood).toBe(data.hood);
    expect(saved.gloves).toBe(data.gloves);
    expect(saved.boots).toBe(data.boots);
    expect(saved.camera).toBe(data.camera);
    expect(saved.torch).toBe(data.torch);
    expect(saved.scooter).toBe(data.scooter);
    expect(saved.airTemperature).toBe(data.airTemperature);
    expect(saved.surfaceTemperature).toBe(data.surfaceTemperature);
    expect(saved.bottomTemperature).toBe(data.bottomTemperature);
    expect(saved.temperatureUnit).toBe(data.temperatureUnit);
    expect(saved.chop).toBe(data.chop);
    expect(saved.current).toBe(data.current);
    expect(saved.weather).toBe(data.weather);
    expect(saved.visibility).toBe(data.visibility);
    expect(saved.notes).toBe(logEntry.notes);
    expect(saved.site?.id).toEqual(diveSite.id);
  });

  it('will update an existing log entry in the database', async () => {
    await Entries.save(data);

    logEntry.logNumber = 44;
    logEntry.timing.entryTime = new Date('2024-05-08T08:34:56Z');
    logEntry.timing.timezone = 'Asia/Singapore';
    logEntry.timing.bottomTime = 55;
    logEntry.timing.duration = 60;

    logEntry.conditions.airTemperature = 25;
    logEntry.conditions.surfaceTemperature = 15;
    logEntry.conditions.bottomTemperature = 10;
    logEntry.conditions.temperatureUnit = TemperatureUnit.Celsius;
    logEntry.conditions.chop = 3;
    logEntry.conditions.current = 2;
    logEntry.conditions.weather = 'Rainy';
    logEntry.conditions.visibility = 5;

    logEntry.depths.averageDepth = 25;
    logEntry.depths.maxDepth = 40;
    logEntry.depths.depthUnit = DepthUnit.Feet;

    logEntry.equipment.weight = 4;
    logEntry.equipment.weightUnit = WeightUnit.Kilograms;
    logEntry.equipment.weightCorrectness = WeightCorrectness.Over;
    logEntry.equipment.trimCorrectness = TrimCorrectness.Good;
    logEntry.equipment.exposureSuit = ExposureSuit.Drysuit;
    logEntry.equipment.hood = false;
    logEntry.equipment.gloves = false;
    logEntry.equipment.boots = false;
    logEntry.equipment.camera = false;
    logEntry.equipment.torch = true;
    logEntry.equipment.scooter = true;

    logEntry.notes = 'This was the best dive yet!';
    logEntry.site = siteFactory.createDiveSite(diveSite);

    await logEntry.save();

    const saved = await Entries.findOneOrFail({
      where: { id: logEntry.id },
      relations: ['owner', 'site'],
    });
    expect(saved.id).toBe(logEntry.id);
    expect(saved.logNumber).toBe(logEntry.logNumber);
    expect(saved.owner.id).toEqual(user.id);
    expect(saved.timezone).toBe('Asia/Singapore');
    expect(saved.entryTime).toEqual(logEntry.timing.entryTime);
    expect(saved.bottomTime).toBe(logEntry.timing.bottomTime);
    expect(saved.duration).toBe(logEntry.timing.duration);

    expect(saved.airTemperature).toBe(logEntry.conditions.airTemperature);
    expect(saved.surfaceTemperature).toBe(
      logEntry.conditions.surfaceTemperature,
    );
    expect(saved.bottomTemperature).toBe(logEntry.conditions.bottomTemperature);
    expect(saved.temperatureUnit).toBe(logEntry.conditions.temperatureUnit);
    expect(saved.chop).toBe(logEntry.conditions.chop);
    expect(saved.current).toBe(logEntry.conditions.current);
    expect(saved.weather).toBe(logEntry.conditions.weather);
    expect(saved.visibility).toBe(logEntry.conditions.visibility);

    expect(saved.averageDepth).toBe(logEntry.depths.averageDepth);
    expect(saved.maxDepth).toBe(logEntry.depths.maxDepth);
    expect(saved.depthUnit).toBe(logEntry.depths.depthUnit);

    expect(saved.weight).toBe(logEntry.equipment.weight);
    expect(saved.weightUnit).toBe(logEntry.equipment.weightUnit);
    expect(saved.weightCorrectness).toBe(logEntry.equipment.weightCorrectness);
    expect(saved.trimCorrectness).toBe(logEntry.equipment.trimCorrectness);
    expect(saved.exposureSuit).toBe(logEntry.equipment.exposureSuit);
    expect(saved.hood).toBe(logEntry.equipment.hood);
    expect(saved.gloves).toBe(logEntry.equipment.gloves);
    expect(saved.boots).toBe(logEntry.equipment.boots);
    expect(saved.camera).toBe(logEntry.equipment.camera);
    expect(saved.torch).toBe(logEntry.equipment.torch);
    expect(saved.scooter).toBe(logEntry.equipment.scooter);

    expect(saved.notes).toBe(logEntry.notes);
    expect(saved.site?.id).toEqual(diveSite.id);
  });

  it('will delete a log entry from the database', async () => {
    data.site = diveSite;
    await Entries.save(data);
    await logEntry.delete();
    const savedEntry = await Entries.findOneBy({ id: logEntry.id });
    expect(savedEntry).toBeNull();
  });

  describe('when working with air tank entries', () => {
    let otherEntry: LogEntryEntity;
    let otherAir: LogEntryAirEntity[];

    beforeEach(async () => {
      // Add some additional dummy data so we can be sure we're not overwriting/destroying unrelated data
      otherEntry = createTestLogEntry(user);
      otherAir = data.air!.map((tank) => ({
        ...tank,
        logEntry: otherEntry,
        id: uuid(),
      }));
      await Entries.save(otherEntry);
      await EntriesAir.save(otherAir);
    });

    it('will return an empty array if no airTanks does not exist', () => {
      data.air = undefined;
      logEntry = new LogEntry(
        Entries,
        EntriesAir,
        EntrySamples,
        siteFactory,
        operatorFactory,
        data,
      );
      expect(logEntry.air).toHaveLength(0);
    });

    it('will return an array of air tank entries', () => {
      expect(logEntry.air).toEqual(data.air!.map(LogEntryAirUtils.entityToDTO));
    });

    it('will allow air array to be set to an empty array', () => {
      logEntry.air = [];
      expect(logEntry.air).toHaveLength(0);
    });

    it('will allow air array to be set to a new array', () => {
      const newValues: LogEntryAirDTO[] = [
        createTestlogEntryAir(),
        createTestlogEntryAir(),
        createTestlogEntryAir(),
        createTestlogEntryAir(),
      ].map(LogEntryAirUtils.entityToDTO);

      logEntry.air = newValues;
      expect(logEntry.air).toEqual(newValues);
    });

    it('will save air tank entries for new log entries', async () => {
      await logEntry.save();
      const saved = await Entries.findOneOrFail({
        where: { id: logEntry.id },
        relations: ['air'],
      });
      expect(saved.air).toHaveLength(3);
      expect(saved.air).toEqual(
        data.air!.map((tank, index) => ({
          ...tank,
          ordinal: index,
          id: saved.air![index].id,
          logEntry: undefined,
        })),
      );

      await expect(EntriesAir.count()).resolves.toBe(6);
    });

    it('will save changes to air tank entries', async () => {
      await logEntry.save();

      const updated: LogEntryAirDTO[] = [
        // 1. Unmodified tank
        logEntry.air[0],

        // 2. Modified tank
        {
          ...logEntry.air[1],
          endPressure: 1000,
        },

        // 3. New tank added
        {
          count: 1,
          material: TankMaterial.Aluminum,
          name: 'AL120',
          workingPressure: 3000,
          volume: 120,
          startPressure: 2700,
          endPressure: 1800,
          pressureUnit: PressureUnit.PSI,
          o2Percent: 0.26,
        },

        // 4. Final tank is removed
      ];
      logEntry.air = updated;

      await logEntry.save();

      const saved = await Entries.findOneOrFail({
        where: { id: logEntry.id },
        relations: ['air'],
      });
      expect(saved.air).toHaveLength(3);
      expect(saved.air).toEqual(
        updated.map((tank, index) => ({
          ...LogEntryAirUtils.dtoToEntity(tank, index, saved.id),
          ordinal: index,
          id: saved.air![index].id,
          logEntry: undefined,
        })),
      );

      await expect(EntriesAir.count()).resolves.toBe(6);
    });

    it('will remove all air tanks if the array is cleared', async () => {
      await logEntry.save();
      logEntry.air = [];
      await logEntry.save();

      const saved = await Entries.findOneOrFail({
        where: { id: logEntry.id },
        relations: ['air'],
      });
      expect(saved.air).toHaveLength(0);

      await expect(EntriesAir.count()).resolves.toBe(3);
    });
  });

  describe('when working with entry samples', () => {
    let sampleData: LogEntrySampleEntity[];

    beforeAll(() => {
      sampleData = TestSamples.map((sample) => ({
        ...(sample as LogEntrySampleEntity),
        logEntry: { id: TestLogEntryData.id } as LogEntryEntity,
      }));
    });

    beforeEach(async () => {
      await logEntry.save();
    });

    it('will return an empty Observable if the log entry does not have any data samples', (cb) => {
      let count = 0;
      logEntry.getSamples().subscribe({
        next: () => {
          count++;
        },
        error: cb,
        complete: () => {
          expect(count).toBe(0);
          cb();
        },
      });
    });

    it('will return samples in batches via Observable', (cb) => {
      let count = 0;
      EntrySamples.save(sampleData)
        .then(() => {
          logEntry.getSamples().subscribe({
            next: (sample) => {
              expect(sample.offset).toEqual(sampleData[count].timeOffset);
              expect(sample.depth).toEqual(sampleData[count].depth);
              expect(sample.temperature).toEqual(sampleData[count].temperature);
              count++;
            },
            error: cb,
            complete: () => {
              expect(count).toBe(sampleData.length);
              cb();
            },
          });
        })
        .catch(cb);
    });

    it('will save sample data to a log entry', async () => {
      await logEntry.saveSamples(
        from(sampleData).pipe(map(LogEntrySampleUtils.entityToDTO)),
      );
      const [saved, count] = await EntrySamples.findAndCount({
        where: { logEntry: { id: logEntry.id } },
        order: { timeOffset: 'ASC' },
        select: { id: true, timeOffset: true, depth: true, temperature: true },
        take: 200,
      });
      expect(count).toEqual(sampleData.length);
      saved.forEach((sample, index) => {
        expect(sample.timeOffset).toEqual(sampleData[index].timeOffset);
        expect(sample.depth).toEqual(sampleData[index].depth);
        expect(sample.temperature).toEqual(sampleData[index].temperature);
      });
    });

    it('will save sample data to a log entry in batches', async () => {
      await logEntry.saveSamples(
        from(sampleData.slice(0, 100)).pipe(
          map(LogEntrySampleUtils.entityToDTO),
        ),
      );
      await logEntry.saveSamples(
        from(sampleData.slice(100, 200)).pipe(
          map(LogEntrySampleUtils.entityToDTO),
        ),
      );
      const [saved, count] = await EntrySamples.findAndCount({
        where: { logEntry: { id: logEntry.id } },
        order: { timeOffset: 'ASC' },
        select: { id: true, timeOffset: true, depth: true, temperature: true },
      });
      expect(count).toEqual(200);
      saved.forEach((sample, index) => {
        expect(sample.timeOffset).toEqual(sampleData[index].timeOffset);
        expect(sample.depth).toEqual(sampleData[index].depth);
        expect(sample.temperature).toEqual(sampleData[index].temperature);
      });
    });

    it('will clear samples from a log entry', async () => {
      await EntrySamples.save(sampleData.slice(0, 100));
      await expect(logEntry.clearSamples()).resolves.toBe(100);
      await expect(
        EntrySamples.existsBy({ logEntry: { id: logEntry.id } }),
      ).resolves.toBe(false);
    });

    it('will do nothing when clearing samples from a log entry that does not have any', async () => {
      await expect(logEntry.clearSamples()).resolves.toBe(0);
    });
  });
});
