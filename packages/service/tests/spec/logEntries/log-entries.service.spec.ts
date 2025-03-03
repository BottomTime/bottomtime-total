import {
  DepthUnit,
  ExposureSuit,
  LogEntrySortBy,
  PressureUnit,
  SortOrder,
  TankMaterial,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import fs from 'fs/promises';
import path from 'path';
import { toArray } from 'rxjs';
import { Repository } from 'typeorm';

import {
  DiveSiteEntity,
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntrySampleEntity,
  OperatorEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSiteFactory, DiveSitesService } from '../../../src/diveSites';
import {
  CreateLogEntryOptions,
  LogEntriesService,
} from '../../../src/logEntries';
import { LogEntryAirUtils } from '../../../src/logEntries/log-entry-air-utils';
import { LogEntryFactory } from '../../../src/logEntries/log-entry-factory';
import { OperatorFactory, OperatorsService } from '../../../src/operators';
import { UserFactory } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestDiveSiteData from '../../fixtures/dive-sites.json';
import TestLogEntryData from '../../fixtures/log-entries.json';
import TestOperatorData from '../../fixtures/operators.json';
import TestUserData from '../../fixtures/user-search-data.json';
import {
  createDiveSiteFactory,
  createOperatorFactory,
  createTestDiveProfile,
  createTestLogEntry,
  createUserFactory,
  parseDiveSiteJSON,
  parseLogEntryJSON,
  parseOperatorJSON,
  parseUserJSON,
} from '../../utils';

dayjs.extend(tz);
dayjs.extend(utc);

describe('Log entries service', () => {
  let Entries: Repository<LogEntryEntity>;
  let EntriesAir: Repository<LogEntryAirEntity>;
  let EntrySamples: Repository<LogEntrySampleEntity>;
  let Users: Repository<UserEntity>;
  let DiveSites: Repository<DiveSiteEntity>;
  let Operators: Repository<OperatorEntity>;
  let siteFactory: DiveSiteFactory;
  let operatorFactory: OperatorFactory;
  let entryFactory: LogEntryFactory;
  let userFactory: UserFactory;
  let diveSitesService: DiveSitesService;
  let operatorsService: OperatorsService;
  let service: LogEntriesService;

  let ownerData: UserEntity[];
  let logEntryData: LogEntryEntity[];
  let airData: LogEntryAirEntity[];
  let diveSiteData: DiveSiteEntity[];
  let operatorData: OperatorEntity[];

  beforeAll(() => {
    Entries = dataSource.getRepository(LogEntryEntity);
    EntriesAir = dataSource.getRepository(LogEntryAirEntity);
    EntrySamples = dataSource.getRepository(LogEntrySampleEntity);
    Users = dataSource.getRepository(UserEntity);
    DiveSites = dataSource.getRepository(DiveSiteEntity);
    Operators = dataSource.getRepository(OperatorEntity);

    siteFactory = createDiveSiteFactory();
    operatorFactory = createOperatorFactory();
    userFactory = createUserFactory();
    entryFactory = new LogEntryFactory(
      Entries,
      EntriesAir,
      EntrySamples,
      siteFactory,
      operatorFactory,
    );

    diveSitesService = new DiveSitesService(DiveSites, siteFactory);
    operatorsService = new OperatorsService(Operators, operatorFactory);
    service = new LogEntriesService(
      Entries,
      entryFactory,
      diveSitesService,
      operatorsService,
    );

    ownerData = TestUserData.slice(0, 4).map((data) => parseUserJSON(data));
    diveSiteData = TestDiveSiteData.map((site, i) =>
      parseDiveSiteJSON(site, ownerData[i % ownerData.length]),
    );
    operatorData = TestOperatorData.map((data, i) =>
      parseOperatorJSON(data, ownerData[i % ownerData.length]),
    );
    logEntryData = TestLogEntryData.map((data, i) =>
      parseLogEntryJSON(
        {
          ...data,
          createdAt: dayjs(data.entryTime).utc().toDate(),
        },
        ownerData[i % ownerData.length],
        diveSiteData[i % diveSiteData.length],
        operatorData[i % operatorData.length],
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
    await Operators.save(operatorData);
  });

  it.skip('will generate some sweet, sweet test data', async () => {
    const data = new Array<LogEntryEntity>(300);
    for (let i = 0; i < data.length; i++) {
      data[i] = createTestLogEntry(ownerData[i % 4]);
      data[i].owner = { id: data[i].owner.id } as UserEntity;
      data[i].site = {
        id: diveSiteData[i % diveSiteData.length].id,
      } as DiveSiteEntity;
      data[i].operator = {
        id: operatorData[i % operatorData.length].id,
      } as OperatorEntity;
    }

    await fs.writeFile(
      path.resolve(__dirname, '../../fixtures/log-entries.json'),
      JSON.stringify(data, null, 2),
      'utf-8',
    );
  });

  it.skip('will generate a dive profile', () => {
    createTestDiveProfile('7dfcb883-110a-4941-bd48-d5c374f6abc6', {
      highTemp: 22,
      lowTemp: 15,
      descentTime: 55,
      duration: 3354,
      maxDepth: 28.2,
      timeAtDepth: 0.5,
      thermocline: 18.1,
    })
      .pipe(toArray())
      .subscribe({
        next: async (stuff) => {
          await fs.writeFile(
            path.resolve(__dirname, '../../fixtures/dive-profile.json'),
            JSON.stringify(stuff, null, 2),
            'utf-8',
          );
        },
      });
  });

  describe('when creating a new log entry', () => {
    it('will create a new log entry with minimal options', async () => {
      const options: CreateLogEntryOptions = {
        owner: userFactory.createUser(ownerData[0]),
        timing: {
          entryTime: new Date('2024-03-28T13:45:00').valueOf(),
          timezone: 'Europe/Amsterdam',
          duration: 3120,
        },
      };

      const entry = await service.createLogEntry(options);
      expect(entry.id).toBeDefined();
      expect(entry.owner).toEqual({
        accountTier: ownerData[0].accountTier,
        userId: ownerData[0].id,
        username: ownerData[0].username,
        memberSince: ownerData[0].memberSince.valueOf(),
        logBookSharing: ownerData[0].logBookSharing,
        name: ownerData[0].name,
        location: ownerData[0].location,
        avatar: ownerData[0].avatar,
      });
      expect(entry.timing.toJSON()).toEqual({
        entryTime: new Date('2024-03-28T13:45:00').valueOf(),
        timezone: 'Europe/Amsterdam',
        duration: 3120,
        bottomTime: undefined,
      });

      const saved = await Entries.findOneOrFail({
        where: { id: entry.id },
        relations: ['air', 'owner'],
      });
      expect(saved.entryTime).toEqual(entry.timing.entryTime);
      expect(saved.timezone).toEqual(entry.timing.timezone);
      expect(saved.duration).toEqual(options.timing.duration);
      expect(saved.owner.id).toEqual(ownerData[0].id);
      expect(saved.air).toHaveLength(0);
    });

    it('will create a new log entry with all options', async () => {
      const options: CreateLogEntryOptions = {
        owner: userFactory.createUser(ownerData[0]),
        logNumber: 123,

        timing: {
          entryTime: new Date('2024-03-28T13:45:00').valueOf(),
          timezone: 'Europe/Amsterdam',
          bottomTime: 2880,
          duration: 3120,
        },

        depths: {
          depthUnit: DepthUnit.Feet,
          maxDepth: 67,
          averageDepth: 45,
        },

        conditions: {
          airTemperature: 28,
          surfaceTemperature: 26,
          bottomTemperature: 24,
          temperatureUnit: TemperatureUnit.Celsius,

          chop: 2,
          current: 3,
          weather: 'Sunny with some clouds',
          visibility: 4.8,
        },

        equipment: {
          weight: 4.4,
          weightUnit: WeightUnit.Kilograms,
          weightCorrectness: WeightCorrectness.Over,
          trimCorrectness: TrimCorrectness.Good,

          exposureSuit: ExposureSuit.Drysuit,
          boots: true,
          gloves: true,
          hood: true,
          camera: false,
          torch: false,
          scooter: false,
        },

        notes: 'Great dive! Saw fish.',
        rating: 3.8,
        tags: [],

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
      expect({
        ...entry.toJSON(),
        id: '3e238287-519a-4a65-bc57-afe0c6cd9ced',
        createdAt: new Date('2024-07-23T11:39:57.073Z'),
        updatedAt: new Date('2024-07-23T14:22:09.372Z'),
      }).toMatchSnapshot();
      expect(entry.id).toHaveLength(36);
      expect(entry.createdAt.valueOf()).toBeCloseTo(Date.now(), -3);

      const saved = await Entries.findOneOrFail({
        where: { id: entry.id },
        relations: ['air', 'owner'],
      });
      expect(saved.logNumber).toEqual(options.logNumber);
      expect(saved.entryTime).toEqual(new Date(options.timing.entryTime));
      expect(saved.timezone).toEqual(options.timing.timezone);
      expect(saved.owner.id).toEqual(ownerData[0].id);
      expect(saved.bottomTime).toEqual(options.timing.bottomTime);
      expect(saved.duration).toEqual(options.timing.duration);
      expect(saved.maxDepth).toEqual(options.depths!.maxDepth);
      expect(saved.averageDepth).toEqual(options.depths!.averageDepth);
      expect(saved.depthUnit).toEqual(options.depths!.depthUnit);

      expect(saved.weight).toEqual(options.equipment!.weight);
      expect(saved.weightUnit).toEqual(options.equipment!.weightUnit);
      expect(saved.weightCorrectness).toEqual(
        options.equipment!.weightCorrectness,
      );
      expect(saved.trimCorrectness).toEqual(options.equipment!.trimCorrectness);

      expect(saved.exposureSuit).toEqual(options.equipment!.exposureSuit);
      expect(saved.boots).toEqual(options.equipment!.boots);
      expect(saved.gloves).toEqual(options.equipment!.gloves);
      expect(saved.hood).toEqual(options.equipment!.hood);
      expect(saved.camera).toEqual(options.equipment!.camera);
      expect(saved.torch).toEqual(options.equipment!.torch);
      expect(saved.scooter).toEqual(options.equipment!.scooter);

      expect(saved.airTemperature).toEqual(options.conditions!.airTemperature);
      expect(saved.surfaceTemperature).toEqual(
        options.conditions!.surfaceTemperature,
      );
      expect(saved.bottomTemperature).toEqual(
        options.conditions!.bottomTemperature,
      );
      expect(saved.temperatureUnit).toEqual(
        options.conditions!.temperatureUnit,
      );
      expect(saved.chop).toEqual(options.conditions!.chop);
      expect(saved.current).toEqual(options.conditions!.current);
      expect(saved.weather).toEqual(options.conditions!.weather);
      expect(saved.visibility).toEqual(options.conditions!.visibility);

      expect(saved.notes).toEqual(options.notes);
      expect(saved.air).toEqual(
        options.air!.map((tank, index) => ({
          ...LogEntryAirUtils.dtoToEntity(tank, index + 1, saved.id),
          id: saved.air![index].id,
          logEntry: undefined,
        })),
      );
    });

    it('will create a new log entry with a dive site attached', async () => {
      const options: CreateLogEntryOptions = {
        owner: userFactory.createUser(ownerData[0]),
        timing: {
          entryTime: new Date('2024-03-28T13:45:00').valueOf(),
          timezone: 'Europe/Amsterdam',
          duration: 52,
        },
        site: siteFactory.createDiveSite(diveSiteData[2]),
      };

      const entry = await service.createLogEntry(options);
      expect(entry.id).toBeDefined();
      expect(entry.owner).toEqual({
        accountTier: ownerData[0].accountTier,
        userId: ownerData[0].id,
        username: ownerData[0].username,
        memberSince: ownerData[0].memberSince.valueOf(),
        logBookSharing: ownerData[0].logBookSharing,
        name: ownerData[0].name,
        location: ownerData[0].location,
        avatar: ownerData[0].avatar,
      });
      expect(entry.timing.entryTime).toEqual(new Date('2024-03-28T13:45:00'));
      expect(entry.timing.timezone).toEqual(options.timing.timezone);
      expect(entry.timing.duration).toEqual(options.timing.duration);
      expect(entry.site?.id).toEqual(diveSiteData[2].id);

      const saved = await Entries.findOneOrFail({
        where: { id: entry.id },
        relations: ['owner', 'site'],
      });
      expect(saved.entryTime).toEqual(entry.timing.entryTime);
      expect(saved.timezone).toEqual(entry.timing.timezone);
      expect(saved.duration).toEqual(options.timing.duration);
      expect(saved.owner.id).toEqual(ownerData[0].id);
      expect(saved.site?.id).toEqual(diveSiteData[2].id);
    });

    it('will create a new log entry with an operator attached', async () => {
      const options: CreateLogEntryOptions = {
        owner: userFactory.createUser(ownerData[0]),
        timing: {
          entryTime: new Date('2024-03-28T13:45:00').valueOf(),
          timezone: 'Europe/Amsterdam',
          duration: 52,
        },
        operator: operatorFactory.createOperator(operatorData[1]),
      };

      const entry = await service.createLogEntry(options);
      expect(entry.id).toBeDefined();
      expect(entry.owner).toEqual({
        accountTier: ownerData[0].accountTier,
        userId: ownerData[0].id,
        username: ownerData[0].username,
        memberSince: ownerData[0].memberSince.valueOf(),
        logBookSharing: ownerData[0].logBookSharing,
        name: ownerData[0].name,
        location: ownerData[0].location,
        avatar: ownerData[0].avatar,
      });
      expect(entry.timing.entryTime).toEqual(new Date('2024-03-28T13:45:00'));
      expect(entry.timing.timezone).toEqual(options.timing.timezone);
      expect(entry.timing.duration).toEqual(options.timing.duration);
      expect(entry.operator?.id).toEqual(operatorData[1].id);

      const saved = await Entries.findOneOrFail({
        where: { id: entry.id },
        relations: ['owner', 'operator'],
      });
      expect(saved.entryTime).toEqual(entry.timing.entryTime);
      expect(saved.timezone).toEqual(entry.timing.timezone);
      expect(saved.duration).toEqual(options.timing.duration);
      expect(saved.owner.id).toEqual(ownerData[0].id);
      expect(saved.operator?.id).toEqual(operatorData[1].id);
    });
  });

  describe('when retrieving a single log entry', () => {
    it('will return the requested log entry', async () => {
      const data = logEntryData[1];
      data.site = diveSiteData[5];
      data.operator = operatorData[2];
      await Entries.save(data);
      await EntriesAir.save(
        data.air!.map((tank) => ({
          ...tank,
          logEntry: { id: data.id } as LogEntryEntity,
        })),
      );
      const result = (await service.getLogEntry(data.id))!;

      expect(result).toBeDefined();
      expect({
        ...result.toJSON(),
        createdAt: new Date('2023-02-15T01:23:32.000Z'),
      }).toMatchSnapshot();
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
      expect({
        ...result.toJSON(),
        createdAt: new Date('2023-02-15T01:23:32.000Z'),
      }).toMatchSnapshot();
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
      expect(results.data).toHaveLength(50);

      expect(
        results.data.map((entry) => ({
          id: entry.id,
          entryTime: entry.timing.entryTime,
          timezone: entry.timing.timezone,
          site: entry.site?.name,
          air: entry.air,
        })),
      ).toMatchSnapshot();
    });

    it('will perform a search with pagination', async () => {
      const results = await service.listLogEntries({ skip: 50, limit: 10 });
      expect({
        data: results.data.map((entry) => ({
          id: entry.id,
          entryTime: entry.timing.entryTime,
          site: entry.site?.name,
        })),
        total: results.totalCount,
      }).toMatchSnapshot();
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
        expect(results.data).toHaveLength(10);

        expect(
          results.data.map((entry) => ({
            id: entry.id,
            entryTime: entry.timing.entryTime,
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
      expect({
        data: results.data.map((entry) => ({
          id: entry.id,
          owner: entry.owner.username,
          entryTime: entry.timing.entryTime,
          site: entry.site?.name,
        })),
        totalCount: results.totalCount,
      }).toMatchSnapshot();
    });

    [
      {
        name: 'between a start date and end date',
        start: new Date('2023-09-01T00:00:00.000Z'),
        end: new Date('2023-10-01T00:00:00.000Z'),
      },
      {
        name: 'after a start date',
        start: new Date('2023-09-01T00:00:00.000Z'),
        end: undefined,
      },
      {
        name: 'before an end date',
        start: undefined,
        end: new Date('2023-10-01T00:00:00.000Z'),
      },
    ].forEach(({ name, start, end }) => {
      it(`will perform a search for log entries ${name}`, async () => {
        const results = await service.listLogEntries({
          startDate: start?.valueOf(),
          endDate: end?.valueOf(),
          limit: 15,
        });
        expect({
          data: results.data.map((entry) => ({
            id: entry.id,
            entryTime: entry.timing.entryTime,
            site: entry.site?.name,
          })),
          totalCount: results.totalCount,
        }).toMatchSnapshot();
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

  describe('when listing recent dive sites', () => {
    it('will return an empty list if user has no entries', async () => {
      await expect(
        service.getRecentDiveSites(ownerData[0].id),
      ).resolves.toHaveLength(0);
    });

    it('will return a distinct list of the most recently used dive sites', async () => {
      await Entries.save(logEntryData);
      const results = await service.getRecentDiveSites(ownerData[0].id, 12);
      expect(results).toHaveLength(12);
      expect(
        results.map((site) => ({ id: site.id, name: site.name })),
      ).toMatchSnapshot();
    });
  });

  describe('when listing recent operators', () => {
    it('will return an empty list if user has no entries', async () => {
      await expect(
        service.getRecentOperators(ownerData[0].id),
      ).resolves.toHaveLength(0);
    });

    it('will return a distinct list of the most recently used operators', async () => {
      await Entries.save(logEntryData);
      const results = await service.getRecentOperators(ownerData[0].id, 12);
      expect(results).toHaveLength(12);
      expect(
        results.map((operator) => ({ id: operator.id, name: operator.name })),
      ).toMatchSnapshot();
    });
  });
});
