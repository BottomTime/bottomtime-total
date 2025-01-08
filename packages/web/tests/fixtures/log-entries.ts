import {
  AccountTier,
  DepthUnit,
  LogBookSharing,
  LogEntryDTO,
  PressureUnit,
  TankMaterial,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';

export const BlankLogEntry: LogEntryDTO = {
  creator: {
    accountTier: AccountTier.Basic,
    logBookSharing: LogBookSharing.FriendsOnly,
    memberSince: new Date('2021-04-11T18:16:12').valueOf(),
    userId: 'd62607ba-67e6-4ef0-9cdf-c1fe3c0b2752',
    username: 'jackie32',
  },
  createdAt: new Date(0).valueOf(),
  timing: {
    duration: -1,
    entryTime: NaN,
    timezone: '',
  },
  id: '',
};

export const MinimalLogEntry: LogEntryDTO = {
  creator: {
    accountTier: AccountTier.Basic,
    logBookSharing: LogBookSharing.FriendsOnly,
    memberSince: new Date('2021-04-11T18:16:12').valueOf(),
    userId: 'eda44e68-1df1-44ce-87ca-3a0e2061808c',
    username: 'logbook_guy',
  },
  createdAt: new Date('2024-07-23T12:52:10Z').valueOf(),
  timing: {
    duration: 44.1,
    entryTime: new Date('2023-01-31T09:16:12').valueOf(),
    timezone: 'America/Los_Angeles',
  },
  id: '1d3d41c9-794a-4280-8335-65f503a3bee7',
};

export const FullLogEntry: LogEntryDTO = {
  createdAt: new Date('2024-07-23T12:52:10Z').valueOf(),
  air: [
    {
      count: 1,
      endPressure: 1000,
      material: TankMaterial.Aluminum,
      name: 'My tank',
      pressureUnit: PressureUnit.PSI,
      startPressure: 3000,
      volume: 12,
      workingPressure: 207,
      o2Percent: 32,
    },
  ],
  creator: {
    accountTier: AccountTier.Basic,
    logBookSharing: LogBookSharing.Public,
    memberSince: new Date('2021-04-11T18:16:12').valueOf(),
    userId: '60b2238b-06c8-4333-9675-f5d6d0912f59',
    username: 'jake32',
    avatar: 'https://example.com/avatar.jpg',
    location: 'Dublin, Ireland',
    name: 'Jake',
  },
  conditions: {
    airTemperature: 72,
    surfaceTemperature: 70,
    bottomTemperature: 50,
    temperatureUnit: TemperatureUnit.Fahrenheit,
    current: 4,
    chop: 2,
    visibility: 2,
    weather: 'Sunny',
  },
  site: {
    id: '3dcf256f-9e75-44bc-9177-ff5f5f281aac',
    name: 'Catalina Island',
    location: 'California',
  },
  timing: {
    duration: 88.34,
    entryTime: new Date('2023-01-31T09:16:12').valueOf(),
    timezone: 'Europe/Dublin',
    bottomTime: 77.77,
  },
  tags: ['wreck', 'night'],
  updatedAt: new Date('2024-07-23T12:52:10Z').valueOf(),
  id: '4ca3e53c-1364-40b2-a6db-ce8e92380b1f',
  logNumber: 12,
  depths: {
    maxDepth: 33.3,
    depthUnit: DepthUnit.Feet,
  },
  equipment: {
    weight: 6.5,
    weightUnit: WeightUnit.Pounds,
  },
  notes: 'This was a great dive!',
};
