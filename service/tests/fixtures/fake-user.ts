import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import { generate } from 'generate-password';
import { hashSync } from 'bcrypt';

import { ProfileVisibility, UserRole } from '../../src/constants';
import { UserDocument } from '../../src/data';
import { ProfileCertificationData, ProfileData } from '../../src/users';

import KnownCertifications from '../../src/data/certifications.json';

const experienceLevels = [
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

function randomCertifications(): ProfileCertificationData[] {
  return faker.helpers
    .arrayElements(certifications, faker.datatype.number({ min: 1, max: 6 }))
    .map((c) => ({
      ...c,
      date: dayjs(faker.date.past(12)).format('YYYY-MM-DD'),
    }));
}

export function fakePassword(): string {
  return generate({
    length: 15,
    numbers: true,
    symbols: true,
    lowercase: true,
    uppercase: true,
    strict: true,
  });
}

export function fakeProfile(profile?: Partial<ProfileData>): ProfileData {
  const data: ProfileData = {
    avatar: profile?.avatar ?? faker.internet.avatar(),
    bio: profile?.bio ?? faker.lorem.paragraph(5),
    birthdate:
      profile?.birthdate ?? dayjs(faker.date.past(70)).format('YYYY-MM-DD'),
    certifications: profile?.certifications ?? randomCertifications(),
    experienceLevel:
      profile?.experienceLevel ?? faker.helpers.arrayElement(experienceLevels),
    location: profile?.location ?? faker.address.cityName(),
    name: profile?.name ?? faker.name.fullName(),
    profileVisibility:
      profile?.profileVisibility ??
      faker.helpers.arrayElement(Object.values(ProfileVisibility)),
    startedDiving:
      profile?.startedDiving ?? faker.date.past(40).getFullYear().toString(),
  };

  if (profile?.customData) {
    data.customData = profile.customData;
  }

  return data;
}

export function fakeUser(
  data?: Partial<UserDocument>,
  password?: string | null,
): UserDocument {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const email = data?.email ?? faker.internet.email(firstName, lastName);
  const username =
    data?.username ?? faker.internet.userName(firstName, lastName);

  const user: UserDocument = {
    _id: data?._id ?? faker.datatype.uuid(),
    email,
    emailLowered: data?.emailLowered ?? email.toLowerCase(),
    emailVerified: data?.emailVerified ?? true,
    emailVerificationToken: data?.emailVerificationToken,
    emailVerificationTokenExpiration: data?.emailVerificationTokenExpiration,
    isLockedOut: data?.isLockedOut ?? false,
    lastLogin: data?.lastLogin ?? faker.date.recent(21),
    memberSince: data?.memberSince ?? faker.date.past(6),
    passwordResetToken: data?.passwordResetToken,
    passwordResetTokenExpiration: data?.passwordResetTokenExpiration,
    role: data?.role ?? UserRole.User,
    username,
    usernameLowered: data?.usernameLowered ?? username.toLowerCase(),

    profile: data?.profile ?? fakeProfile(),

    friends: data?.friends,
  };

  if (password !== null) {
    user.passwordHash =
      data?.passwordHash ?? hashSync(password ?? fakePassword(), 1);
  }

  // Remove undefined properties or MongoDB will write these as "null".
  Object.keys(user).forEach((key) => {
    if (user[key] === undefined) {
      delete user[key];
    }
  });

  return user;
}
