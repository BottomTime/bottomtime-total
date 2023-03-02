import { hashSync } from 'bcrypt';
import { faker } from '@faker-js/faker';
import { generate } from 'generate-password';
import { type UserDocument } from '../../src/data';
import { UserRole } from '../../src/constants';

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
    _id: data?._id,
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
