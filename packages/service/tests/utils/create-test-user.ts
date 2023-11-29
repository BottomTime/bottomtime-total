import { faker } from '@faker-js/faker';
import {
  UserData,
  UserDocument,
  UserModel,
} from '../../src/schemas/user.document';
import { ProfileVisibility, UserRole } from '@bottomtime/api';
import { hashSync } from 'bcrypt';
import { generate } from 'generate-password';

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
    memberSince: options?.memberSince ?? faker.date.past(6),
    passwordResetToken: options?.passwordResetToken,
    passwordResetTokenExpiration: options?.passwordResetTokenExpiration,
    role: options?.role ?? UserRole.User,
    username,
    usernameLowered: options?.usernameLowered ?? username.toLowerCase(),

    friends: [] as any,

    tanks: [] as any,

    settings: {
      profileVisibility: ProfileVisibility.FriendsOnly,
    },
  };

  if (typeof password === 'string') {
    data.passwordHash = hashSync(password, 1);
    // Hash the password parameter.
  } else if (password === undefined) {
    // Use the password hash from the options (or default to a random password).
    data.passwordHash = options?.passwordHash ?? hashSync(fakePassword(), 1);
  } // If password === null do NOT set a password hash on the user account!

  return new UserModel(data);
}
