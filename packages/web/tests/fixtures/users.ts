import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  UserDTO,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

export const BasicUser: UserDTO = {
  id: '50a9504c-ee2c-485e-91e0-4d352409338e',
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

export const AdminUser: UserDTO = {
  id: '50a9504c-ee2c-485e-91e0-4d352409338e',
  email: 'andy_admin@bottomti.me',
  emailVerified: true,
  hasPassword: true,
  isLockedOut: false,
  lastLogin: new Date('2021-01-01T00:00:00.000Z'),
  lastPasswordChange: new Date('2021-01-01T00:00:00.000Z'),
  memberSince: new Date('2021-01-01T00:00:00.000Z'),
  role: UserRole.Admin,
  settings: {
    depthUnit: DepthUnit.Meters,
    pressureUnit: PressureUnit.Bar,
    temperatureUnit: TemperatureUnit.Celsius,
    weightUnit: WeightUnit.Kilograms,
  },
  profile: {
    username: 'andy_admin',
    memberSince: new Date('2021-01-01T00:00:00.000Z'),
    userId: '50A9504C-EE2C-485E-91E0-4D352409338E',
    name: 'Andy Admin',
  },
  username: 'andy_admin',
};

export const UserWithFullProfile: UserDTO = {
  emailVerified: false,
  hasPassword: true,
  id: 'e7fdcf40-509e-49f1-85d2-24f35b0afe28',
  isLockedOut: false,
  memberSince: new Date('2017-12-29T17:03:07.671Z'),
  profile: {
    avatar:
      'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/601.jpg',
    bio: 'Facilis deleniti fugiat. Nesciunt architecto facilis consectetur laborum iusto doloribus. Minima nulla nemo unde quisquam quod suscipit deserunt blanditiis deserunt. Ipsa saepe quibusdam beatae tempora labore maxime odio. Labore debitis id doloribus voluptatibus ratione animi dolores.',
    birthdate: '2014-09-19',
    experienceLevel: 'Experienced',
    location: 'Hamillside, CO, AZ',
    memberSince: new Date('2017-12-29T17:03:07.671Z'),
    name: 'Abel Koss',
    startedDiving: '2018-11-20',
    userId: 'e7fdcf40-509e-49f1-85d2-24f35b0afe28',
    username: 'Abel_Koss49',
  },
  role: UserRole.User,
  username: 'Abel_Koss49',
  email: 'Abel5@yahoo.com',
  settings: {
    depthUnit: DepthUnit.Feet,
    pressureUnit: PressureUnit.PSI,
    temperatureUnit: TemperatureUnit.Fahrenheit,
    weightUnit: WeightUnit.Pounds,
  },
};

export const UserWithEmptyProfile: UserDTO = {
  emailVerified: false,
  hasPassword: true,
  id: '8772f482-8bc1-4ae2-ab15-e0d4d741878d',
  isLockedOut: false,
  memberSince: new Date('2022-01-25T11:40:20.928Z'),
  profile: {
    memberSince: new Date('2022-01-25T11:40:20.928Z'),
    userId: '8772f482-8bc1-4ae2-ab15-e0d4d741878d',
    username: 'Adolf19',
  },
  role: UserRole.User,
  username: 'Adolf19',
  email: 'Adolf.DAmore33@hotmail.com',
  settings: {
    depthUnit: DepthUnit.Feet,
    pressureUnit: PressureUnit.PSI,
    temperatureUnit: TemperatureUnit.Fahrenheit,
    weightUnit: WeightUnit.Pounds,
  },
};
