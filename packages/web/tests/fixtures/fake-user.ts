import { faker } from '@faker-js/faker';
import { ProfileData, UserData } from '@/client/users';
import { ProfileVisibility, UserRole } from '@/constants';

export function fakeProfile(
  firstName?: string,
  lastName?: string,
): ProfileData {
  return {
    avatar: faker.internet.avatar(),
    bio: faker.lorem.sentences(6),
    birthdate: faker.date.past(60).toISOString(),
    customData: {},
    certifications: [],
    experienceLevel: faker.helpers.arrayElement([
      'beginner',
      'novice',
      'experience',
      'expert',
    ]),
    location: faker.address.city(),
    name: `${firstName ?? faker.name.firstName()} ${
      lastName ?? faker.name.lastName()
    }`,
    profileVisibility: faker.helpers.arrayElement(
      Object.values(ProfileVisibility),
    ),
    startedDiving: faker.date.past(12).getFullYear().toString(),
  };
}

export function fakeUser(): UserData {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();

  const data: UserData = {
    id: faker.datatype.uuid(),
    email: faker.internet.email(firstName, lastName),
    emailVerified: true,
    hasPassword: true,
    isLockedOut: false,
    lastLogin: faker.date.recent(20),
    lastPasswordChange: faker.date.recent(180),
    memberSince: faker.date.past(6),
    role: UserRole.User,
    username: faker.internet.userName(firstName, lastName),
    profile: fakeProfile(firstName, lastName),
  };

  return data;
}
