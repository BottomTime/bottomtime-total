import {
  DepthUnit,
  LogBookSharing,
  LogEntryDTO,
  WeightUnit,
} from '@bottomtime/api';

export const BlankLogEntry: LogEntryDTO = {
  creator: {
    logBookSharing: LogBookSharing.FriendsOnly,
    memberSince: new Date('2021-04-11T18:16:12'),
    userId: 'd62607ba-67e6-4ef0-9cdf-c1fe3c0b2752',
    username: 'jackie32',
  },
  duration: -1,
  entryTime: {
    date: '',
    timezone: '',
  },
  id: '',
};

export const MinimalLogEntry: LogEntryDTO = {
  creator: {
    logBookSharing: LogBookSharing.FriendsOnly,
    memberSince: new Date('2021-04-11T18:16:12'),
    userId: 'eda44e68-1df1-44ce-87ca-3a0e2061808c',
    username: 'logbook_guy',
  },
  duration: 44.1,
  entryTime: {
    date: '2023-01-31T09:16:12',
    timezone: 'America/Los_Angeles',
  },
  id: '1d3d41c9-794a-4280-8335-65f503a3bee7',
};

export const FullLogEntry: LogEntryDTO = {
  creator: {
    logBookSharing: LogBookSharing.Public,
    memberSince: new Date('2021-04-11T18:16:12'),
    userId: '60b2238b-06c8-4333-9675-f5d6d0912f59',
    username: 'jake32',
    avatar: 'https://example.com/avatar.jpg',
    location: 'Dublin, Ireland',
    name: 'Jake',
  },
  duration: 88.34,
  entryTime: {
    date: '2023-01-31T09:16:12',
    timezone: 'Europe/Dublin',
  },
  id: '4ca3e53c-1364-40b2-a6db-ce8e92380b1f',
  bottomTime: 77.77,
  logNumber: 12,
  maxDepth: {
    depth: 33.3,
    unit: DepthUnit.Feet,
  },
  weights: {
    weight: 6.5,
    unit: WeightUnit.Pounds,
  },
  notes: 'This was a great dive!',
};
