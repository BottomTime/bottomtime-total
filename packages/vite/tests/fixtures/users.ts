import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserDTO,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

export const BasicUser: UserDTO = {
  id: '50A9504C-EE2C-485E-91E0-4D352409338E',
  email: 'sam_smith@gmail.com',
  emailVerified: true,
  hasPassword: true,
  isLockedOut: false,
  lastLogin: new Date('2021-01-01T00:00:00.000Z'),
  lastPasswordChange: new Date('2021-01-01T00:00:00.000Z'),
  memberSince: new Date('2021-01-01T00:00:00.000Z'),
  role: UserRole.User,
  settings: {
    depthUnit: DepthUnit.Meters,
    pressureUnit: PressureUnit.Bar,
    profileVisibility: ProfileVisibility.FriendsOnly,
    temperatureUnit: TemperatureUnit.Celsius,
    weightUnit: WeightUnit.Kilograms,
  },
  profile: {
    username: 'sam_smith',
    memberSince: new Date('2021-01-01T00:00:00.000Z'),
    userId: '50A9504C-EE2C-485E-91E0-4D352409338E',
    name: 'Sam Smith',
  },
  username: 'sam_smith',
};
