import {
  CurrentUserDTO,
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';
import { Pinia, createPinia } from 'pinia';
import { useCurrentUser } from '../../../src/store';
import { User } from '../../../src/client/user';

const AuthenticatedUser: CurrentUserDTO = {
  anonymous: false,
  id: '123',
  email: 'realuser@gmail.com',
  username: 'realuser',
  emailVerified: true,
  role: UserRole.User,
  hasPassword: true,
  isLockedOut: false,
  memberSince: new Date('2021-01-01T00:00:00.000Z'),
  profile: {
    memberSince: new Date('2021-01-01T00:00:00.000Z'),
    userId: '123',
    username: 'realuser',
  },
  settings: {
    depthUnit: DepthUnit.Meters,
    pressureUnit: PressureUnit.Bar,
    profileVisibility: ProfileVisibility.Private,
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
    const user = new User(AuthenticatedUser);
    const store = useCurrentUser(pinia);
    expect(store.user).toBeNull();

    store.user = user;
    expect(store.user).toEqual(new User(AuthenticatedUser));
  });
});
