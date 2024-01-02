import { faker } from '@faker-js/faker';
import {
  ProfileData,
  UserData,
  UserDocument,
  UserModel,
} from '../../src/schemas/user.document';
import {
  UserCertificationDTO,
  ProfileVisibility,
  UserRole,
} from '@bottomtime/api';
import { hashSync } from 'bcrypt';
import { generate } from 'generate-password';

import KnownCertifications from '../../src/data/certifications.json';
import dayjs from 'dayjs';
import { Types } from 'mongoose';

const ExperienceLevels: readonly string[] = [
  'Beginner',
  'Novice',
  'Experience',
  'Expert',
  'Professional',
];
const certifications = KnownCertifications.map((c) => ({
  agency: c.agency,
  course: c.course,
}));

export function randomCertifications(): UserCertificationDTO[] {
  return faker.helpers
    .arrayElements(certifications, faker.datatype.number({ min: 1, max: 6 }))
    .map((c) => ({
      ...c,
      date: dayjs(faker.date.past(12)).format('YYYY-MM-DD'),
    }));
}

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

export function createTestProfile(profile?: Partial<ProfileData>): ProfileData {
  const data: ProfileData = {
    avatar: profile?.avatar ?? faker.internet.avatar(),
    bio: profile?.bio ?? faker.lorem.paragraph(5),
    birthdate:
      profile?.birthdate ?? dayjs(faker.date.past(70)).format('YYYY-MM-DD'),
    // certifications: profile?.certifications ?? randomCertifications(),
    experienceLevel:
      profile?.experienceLevel ?? faker.helpers.arrayElement(ExperienceLevels),
    location: profile?.location ?? faker.address.cityName(),
    name: profile?.name ?? faker.name.fullName(),
    startedDiving:
      profile?.startedDiving ?? faker.date.past(40).getFullYear().toString(),
  };

  if (profile?.customData) {
    data.customData = profile.customData;
  }

  return data;
}

export function createTestUser(
  options?: Partial<UserData>,
  password?: string | null,
): UserDocument {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const email = options?.email ?? faker.internet.email(firstName, lastName);
  const username =
    options?.username ?? faker.internet.userName(firstName, lastName);

  const data: UserData = {
    _id: options?._id ?? faker.datatype.uuid(),

    email,
    emailLowered: options?.emailLowered ?? email.toLowerCase(),
    emailVerified: options?.emailVerified ?? true,
    emailVerificationToken: options?.emailVerificationToken,
    emailVerificationTokenExpiration: options?.emailVerificationTokenExpiration,
    isLockedOut: options?.isLockedOut ?? false,
    lastLogin: options?.lastLogin ?? faker.date.recent(21),
    lastPasswordChange: options?.lastPasswordChange ?? faker.date.past(2),
    memberSince: options?.memberSince ?? faker.date.past(6),
    passwordResetToken: options?.passwordResetToken,
    passwordResetTokenExpiration: options?.passwordResetTokenExpiration,
    profile: options?.profile ?? createTestProfile(),
    role: options?.role ?? UserRole.User,
    username,
    usernameLowered: options?.usernameLowered ?? username.toLowerCase(),

    settings: options?.settings ?? {
      profileVisibility: ProfileVisibility.FriendsOnly,
    },
  };

  if (typeof password === 'string') {
    data.passwordHash = hashSync(password, 1);
    // Hash the password parameter.
  } else if (password === undefined) {
    // Use the password hash from the options (or default to a random password).
    data.passwordHash =
      options?.passwordHash ?? hashSync(createTestPassword(), 1);
  } // If password === null do NOT set a password hash on the user account!

  return new UserModel(data);
}
