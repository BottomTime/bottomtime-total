import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { type UserDocument } from '../../src/data';
import { UserRole } from '../../src/constants';

export function fakeUser(
  data?: Partial<UserDocument>,
  password?: string,
): UserDocument {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const email = data?.email ?? faker.internet.email(firstName, lastName);
  const username =
    data?.username ?? faker.internet.userName(firstName, lastName);
  const passwordHash =
    data?.passwordHash ??
    bcrypt.hashSync(password ?? faker.internet.password(), 2);

  return {
    email,
    emailLowered: data?.emailLowered ?? email.toLowerCase(),
    emailVerified: data?.emailVerified ?? true,
    emailVerificationToken: data?.emailVerificationToken,
    isLockedOut: data?.isLockedOut ?? false,
    lastLogin: data?.lastLogin ?? faker.date.recent(21),
    memberSince: data?.memberSince ?? faker.date.past(6),
    passwordHash,
    role: data?.role ?? UserRole.User,
    username,
    usernameLowered: data?.usernameLowered ?? username.toLowerCase(),
  };
}
