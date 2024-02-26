import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import dayjs from 'dayjs';
import { Types } from 'mongoose';

import { UserData, UserDocument, UserModel } from '../../../src/schemas';

// Matches Password = 'Password1';
const PasswordHash =
  '$2b$04$KJMuCKJh.TTOGzp8PwqaDeNAZLEeP1PlcriTpoAYCAWxldk0oj6Ii';

export function fakeUser(): UserDocument {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const username = faker.internet.userName(firstName, lastName);
  const email = faker.internet.email(firstName, lastName);

  const data: UserData = {
    _id: faker.datatype.uuid(),
    username,
    usernameLowered: username.toLowerCase(),
    email,
    emailLowered: email.toLowerCase(),
    emailVerified: faker.datatype.boolean(),
    passwordHash: PasswordHash,
    memberSince: faker.date.past(10),

    // 0.5% of users will be admins.
    role:
      faker.helpers.maybe(() => UserRole.Admin, { probability: 0.005 }) ??
      UserRole.User,

    // 5% of users will have their accounts suspended.
    isLockedOut:
      faker.helpers.maybe(() => true, { probability: 0.05 }) ?? false,

    profile: {
      avatar: faker.internet.avatar(),
      bio: faker.lorem.paragraph(),
      birthdate: dayjs(faker.date.past(50)).format('YYYY-MM-DD'),
      certifications: new Types.DocumentArray<{
        agency: string;
        course: string;
        date: string | null | undefined;
      }>([]),
      name: `${firstName} ${lastName}`,
      location: `${faker.address.city()}, ${faker.address.stateAbbr()}, ${faker.address.countryCode()}`,
      experienceLevel: faker.helpers.arrayElement([
        'Beginner',
        'Novice',
        'Experienced',
        'Expert',
      ]),
      startedDiving: dayjs(faker.date.past(20)).format('YYYY-MM-DD'),
    },
    settings: {
      depthUnit: faker.helpers.arrayElement(Object.values(DepthUnit)),
      pressureUnit: faker.helpers.arrayElement(Object.values(PressureUnit)),
      temperatureUnit: faker.helpers.arrayElement(
        Object.values(TemperatureUnit),
      ),
      weightUnit: faker.helpers.arrayElement(Object.values(WeightUnit)),
      profileVisibility: faker.helpers.arrayElement(
        Object.values(ProfileVisibility),
      ),
    },
  };

  return new UserModel(data);
}
