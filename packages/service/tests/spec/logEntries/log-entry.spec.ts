import {
  DepthUnit,
  LogBookSharing,
  LogEntryAirDTO,
  PressureUnit,
  TankMaterial,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import {
  DiveSiteEntity,
  LogEntryAirEntity,
  LogEntryEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSiteFactory } from '../../../src/diveSites/dive-site-factory';
import { LogEntry } from '../../../src/logEntries';
import { LogEntryAirUtils } from '../../../src/logEntries/log-entry-air-utils';
import { dataSource } from '../../data-source';
import { createDiveSiteFactory } from '../../utils/create-dive-site-factory';
import { createTestDiveSite } from '../../utils/create-test-dive-site';
import { createTestLogEntry } from '../../utils/create-test-log-entry';
import { createTestlogEntryAir } from '../../utils/create-test-log-entry-air';
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
  updatedOn: new Date('2024-05-21T19:46:14.342Z'),
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

  notes: 'This was a great dive!',
};

dayjs.extend(tz);
dayjs.extend(utc);

describe('Log Entry class', () => {
  let Users: Repository<UserEntity>;
  let Entries: Repository<LogEntryEntity>;
  let EntriesAir: Repository<LogEntryAirEntity>;
  let Sites: Repository<DiveSiteEntity>;

  let user: UserEntity;
  let data: LogEntryEntity;
  let logEntry: LogEntry;
  let diveSite: DiveSiteEntity;

  let siteFactory: DiveSiteFactory;

  beforeAll(() => {
    Entries = dataSource.getRepository(LogEntryEntity);
    EntriesAir = dataSource.getRepository(LogEntryAirEntity);
    Users = dataSource.getRepository(UserEntity);
    Sites = dataSource.getRepository(DiveSiteEntity);

    user = createTestUser(CreatorData);
    diveSite = createTestDiveSite(user, TestSiteData);

    siteFactory = createDiveSiteFactory();
  });

  beforeEach(async () => {
    data = createTestLogEntry(user, TestLogEntryData);
    logEntry = new LogEntry(Entries, EntriesAir, siteFactory, data);

    await Users.save(user);
    await Sites.save(diveSite);
  });

  it('will return properties correctly', () => {
    data.site = diveSite;

    expect(logEntry.id).toBe(data.id);
    expect(logEntry.logNumber).toBe(data.logNumber);
    expect(logEntry.owner).toEqual({
      userId: CreatorData.id,
      memberSince: CreatorData.memberSince,
      username: CreatorData.username,
      logBookSharing: CreatorData.logBookSharing,
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
    expect(logEntry.site?.toEntity()).toEqual(diveSite);
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

  it('will allow optional properties to be set to undefined', () => {
    data.site = diveSite;

    logEntry.logNumber = undefined;
    logEntry.bottomTime = undefined;
    logEntry.maxDepth = undefined;
    logEntry.notes = undefined;
    logEntry.site = undefined;

    expect(logEntry.logNumber).toBeUndefined();
    expect(logEntry.bottomTime).toBeUndefined();
    expect(logEntry.maxDepth).toBeUndefined();
    expect(logEntry.notes).toBeUndefined();
    expect(logEntry.site).toBeUndefined();
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
    expect(saved.timestamp).toEqual(data.timestamp);
    expect(saved.entryTime).toBe(data.entryTime);
    expect(saved.timezone).toBe(data.timezone);
    expect(saved.bottomTime).toBe(logEntry.bottomTime);
    expect(saved.duration).toBe(logEntry.duration);
    expect(saved.maxDepth).toBe(logEntry.maxDepth!.depth);
    expect(saved.maxDepthUnit).toBe(logEntry.maxDepth!.unit);
    expect(saved.notes).toBe(logEntry.notes);
    expect(saved.site?.id).toEqual(diveSite.id);
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
    logEntry.site = siteFactory.createDiveSite(diveSite);

    await logEntry.save();

    const saved = await Entries.findOneOrFail({
      where: { id: logEntry.id },
      relations: ['owner', 'site'],
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
      logEntry = new LogEntry(Entries, EntriesAir, siteFactory, data);
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
          ...LogEntryAirUtils.dtoToEntity(tank),
          ordinal: index,
          id: saved.air![index].id,
        })),
      );

      await expect(EntriesAir.count()).resolves.toBe(6);
    });

    it('will save changes made directly to the air tanks array', async () => {
      await logEntry.save();
      logEntry.air[1].endPressure = 888;
      logEntry.air.push({
        count: 1,
        endPressure: 1111,
        material: TankMaterial.Steel,
        name: 'HP120',
        o2Percent: 0.32,
        hePercent: 0.5,
        pressureUnit: PressureUnit.PSI,
        startPressure: 3500,
        volume: 120,
        workingPressure: 3442,
      });
      await logEntry.save();

      const saved = await Entries.findOneOrFail({
        where: { id: logEntry.id },
        relations: ['air'],
      });
      expect(saved.air).toHaveLength(4);
      expect(saved.air).toEqual(
        logEntry.air.map((tank, index) => ({
          ...LogEntryAirUtils.dtoToEntity(tank),
          ordinal: index,
          id: saved.air![index].id,
        })),
      );

      await expect(EntriesAir.count()).resolves.toBe(7);
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
});
