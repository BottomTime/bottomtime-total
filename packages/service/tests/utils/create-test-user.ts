import {
  AccountTier,
  DepthUnit,
  LogBookSharing,
  PressureUnit,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import { hashSync } from 'bcryptjs';
import { generate } from 'generate-password';
import { z } from 'zod';

import { UserEntity } from '../../src/data';

const UserJsonSchema = z.object({
  id: z.string(),
  accountTier: z.nativeEnum(AccountTier).default(AccountTier.Basic),
  avatar: z.string().nullable().default(null),
  bio: z.string().nullable().default(null),
  customData: z.record(z.unknown()).nullable(),
  depthUnit: z.nativeEnum(DepthUnit).default(DepthUnit.Meters),
  email: z.string().nullable().default(null),
  emailLowered: z.string().nullable().default(null),
  emailVerified: z.coerce.boolean(),
  emailVerificationToken: z.string().nullable().default(null),
  emailVerificationTokenExpiration: z.coerce.date().nullable().default(null),
  experienceLevel: z.string().nullable().default(null),
  isLockedOut: z.coerce.boolean(),
  lastLogin: z.coerce.date().nullable().default(null),
  lastPasswordChange: z.coerce.date().nullable().default(null),
  location: z.string().nullable().default(null),
  logBookSharing: z.nativeEnum(LogBookSharing).default(LogBookSharing.Private),
  memberSince: z.coerce.date(),
  name: z.string().nullable().default(null),
  passwordHash: z.string().nullable().default(null),
  passwordResetToken: z.string().nullable().default(null),
  passwordResetTokenExpiration: z.coerce.date().nullable().default(null),
  pressureUnit: z.nativeEnum(PressureUnit).default(PressureUnit.Bar),
  temperatureUnit: z
    .nativeEnum(TemperatureUnit)
    .default(TemperatureUnit.Celsius),
  role: z.nativeEnum(UserRole),
  startedDiving: z.string().nullable().default(null),
  username: z.string(),
  usernameLowered: z.string(),
  weightUnit: z.nativeEnum(WeightUnit).default(WeightUnit.Kilograms),
  xp: z.number().int().default(0),
});

const ExperienceLevels: readonly string[] = [
  'Beginner',
  'Novice',
  'Experience',
  'Expert',
  'Professional',
];

// const certifications = KnownCertifications.map((c) => ({
//   agency: c.agency,
//   course: c.course,
// }));

// export function randomCertifications(): UserCertificationDTO[] {
//   return faker.helpers
//     .arrayElements(certifications, faker.datatype.number({ min: 1, max: 6 }))
//     .map((c) => ({
//       ...c,
//       date: dayjs(faker.date.past(12)).format('YYYY-MM-DD'),
//     }));
// }

export function createTestPassword(): string {
  return generate({
    length: 15,
    numbers: true,
    symbols: true,
    lowercase: true,
    uppercase: true,
    strict: true,
  });
}

export function createTestUser(
  options?: Partial<UserEntity>,
  password?: string | null,
): UserEntity {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = options?.email ?? faker.internet.email({ firstName, lastName });
  const username =
    options?.username ?? faker.internet.userName({ firstName, lastName });

  const data: Partial<UserEntity> = {
    id: options?.id ?? faker.string.uuid(),

    email,
    emailLowered: options?.emailLowered ?? email.toLowerCase(),
    emailVerified: options?.emailVerified ?? true,
    emailVerificationToken: options?.emailVerificationToken ?? null,
    emailVerificationTokenExpiration:
      options?.emailVerificationTokenExpiration ?? null,
    isLockedOut: options?.isLockedOut ?? false,
    lastLogin: options?.lastLogin ?? faker.date.recent({ days: 21 }),
    lastPasswordChange:
      options?.lastPasswordChange ?? faker.date.past({ years: 2 }),
    memberSince: options?.memberSince ?? faker.date.past({ years: 6 }),
    passwordResetToken: options?.passwordResetToken ?? null,
    passwordResetTokenExpiration: options?.passwordResetTokenExpiration ?? null,

    avatar: options?.avatar ?? faker.image.avatar(),
    bio: options?.bio ?? faker.person.bio(),
    experienceLevel:
      options?.experienceLevel ?? faker.helpers.arrayElement(ExperienceLevels),
    location: options?.location ?? faker.location.city(),
    logBookSharing:
      options?.logBookSharing ??
      faker.helpers.arrayElement(Object.values(LogBookSharing)),
    name: options?.name ?? faker.person.fullName(),
    startedDiving:
      options?.startedDiving ??
      faker.date.past({ years: 40 }).getFullYear().toString(),

    role: options?.role ?? UserRole.User,
    username,
    usernameLowered: options?.usernameLowered ?? username.toLowerCase(),

    depthUnit: options?.depthUnit ?? DepthUnit.Meters,
    pressureUnit: options?.pressureUnit ?? PressureUnit.Bar,
    temperatureUnit: options?.temperatureUnit ?? TemperatureUnit.Celsius,
    weightUnit: options?.weightUnit ?? WeightUnit.Kilograms,
    xp: options?.xp ?? faker.number.int({ min: 0, max: 10000 }),
  };

  if (typeof password === 'string') {
    data.passwordHash = hashSync(password, 1);
    // Hash the password parameter.
  } else if (password === undefined) {
    // Use the password hash from the options (or default to a random password).
    data.passwordHash =
      options?.passwordHash ?? hashSync(createTestPassword(), 1);
  } // If password === null do NOT set a password hash on the user account!

  const user = new UserEntity();
  Object.assign(user, data);

  return user;
}

export function parseUserJSON(data: unknown): UserEntity {
  const user = UserJsonSchema.parse(data);
  return user;
}
