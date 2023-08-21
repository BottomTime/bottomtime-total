import { faker } from '@faker-js/faker';
import { ProfileData, UserData } from '@/client/users';
import { ProfileVisibility, UserRole } from '@/constants';

export function fakeProfile(): ProfileData {
  return {
    profileVisibility: faker.helpers.arrayElement(
      Object.values(ProfileVisibility),
    ),
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
    profile: fakeProfile(),
  };

  return data;
}
