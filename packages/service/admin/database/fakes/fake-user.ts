import {
  DepthUnit,
  LogBookSharing,
  PressureUnit,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import dayjs from 'dayjs';

import { UserEntity } from '../../../src/data';

// Matches Password = 'Password1';
const PasswordHash =
  '$2b$04$KJMuCKJh.TTOGzp8PwqaDeNAZLEeP1PlcriTpoAYCAWxldk0oj6Ii';

export function fakeUser(): UserEntity {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const username = faker.internet.userName({ firstName, lastName });
  const email = faker.internet.email({ firstName, lastName });

  const data = new UserEntity();
  data.id = faker.string.uuid();
  data.username = username;
  data.usernameLowered = username.toLowerCase();
  data.email = email;
  data.emailLowered = email.toLowerCase();
  data.emailVerified = faker.datatype.boolean();
  data.passwordHash = PasswordHash;
  data.memberSince = faker.date.past({ years: 10 });
  data.role =
    faker.helpers.maybe(() => UserRole.Admin, { probability: 0.005 }) ??
    UserRole.User;
  data.isLockedOut =
    faker.helpers.maybe(() => true, { probability: 0.05 }) ?? false;

  // Profile
  data.avatar = faker.image.avatar();
  data.bio = faker.person.bio();
  data.certifications = [];
  data.name = `${firstName} ${lastName}`;
  data.location = `${faker.location.city()}, ${faker.location.state({
    abbreviated: true,
  })}, ${faker.location.countryCode()}`;
  data.logBookSharing = faker.helpers.arrayElement(
    Object.values(LogBookSharing),
  );
  data.experienceLevel = faker.helpers.arrayElement([
    'Beginner',
    'Novice',
    'Experienced',
    'Expert',
  ]);
  data.startedDiving = dayjs(faker.date.past({ years: 20 })).format(
    'YYYY-MM-DD',
  );

  // Settings
  data.depthUnit = faker.helpers.arrayElement(Object.values(DepthUnit));
  data.pressureUnit = faker.helpers.arrayElement(Object.values(PressureUnit));
  data.temperatureUnit = faker.helpers.arrayElement(
    Object.values(TemperatureUnit),
  );
  data.weightUnit = faker.helpers.arrayElement(Object.values(WeightUnit));

  return data;
}
