import {
  AccountTier,
  DepthUnit,
  LogBookSharing,
  PressureUnit,
  TemperatureUnit,
  UserDTO,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { Pinia, createPinia } from 'pinia';

import { useCurrentUser } from '../../../src/store';

const AuthenticatedUser: UserDTO = {
  id: '123',
  accountTier: AccountTier.Basic,
  email: 'realuser@gmail.com',
  username: 'realuser',
  emailVerified: true,
  role: UserRole.User,
  hasPassword: true,
  isLockedOut: false,
  memberSince: new Date('2021-01-01T00:00:00.000Z').valueOf(),
  profile: {
    accountTier: AccountTier.Basic,
    memberSince: new Date('2021-01-01T00:00:00.000Z').valueOf(),
    userId: '123',
    username: 'realuser',
    name: 'Real User',
    logBookSharing: LogBookSharing.FriendsOnly,
  },
  settings: {
    depthUnit: DepthUnit.Meters,
    pressureUnit: PressureUnit.Bar,
    temperatureUnit: TemperatureUnit.Celsius,
    weightUnit: WeightUnit.Kilograms,
  },
};

describe('Current User Store', () => {
  let pinia: Pinia;

  beforeEach(() => {
    pinia = createPinia();
  });

  it('will update current user', () => {
    const store = useCurrentUser(pinia);
    expect(store.user).toBeNull();
    expect(store.anonymous).toBe(true);

    store.user = AuthenticatedUser;
    expect(store.user).toEqual(AuthenticatedUser);
    expect(store.anonymous).toBe(false);
  });

  it('will show correct display name', () => {
    const store = useCurrentUser(pinia);
    store.user = AuthenticatedUser;
    expect(store.displayName).toEqual('Real User');
  });
});
