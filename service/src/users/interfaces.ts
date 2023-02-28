import { type UserRole } from '../constants';

export interface User {
  readonly id: string;
  readonly username: string;
  readonly email?: string;
  readonly emailVerified: boolean;
  readonly isLockedOut: boolean;
  readonly role: UserRole;
  readonly hasPassword: boolean;

  changeUsername: (newUsername: string) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  changeRole: (newRole: UserRole) => Promise<void>;

  requestEmailVerificationToken: () => Promise<string>;
  verifyEmail: (token: string) => Promise<boolean>;

  requestPasswordResetToken: () => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  forceResetPassword: (newPassword: string) => Promise<void>;

  lockAccount: () => Promise<void>;
  unlockAccount: () => Promise<void>;
}

export interface CreateUserOptions {
  username: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface SearchUsersOptions {
  query?: string;
  role?: UserRole;
  skip?: number;
  limit?: number;
}

export interface UserManager {
  createUser: (options: CreateUserOptions) => Promise<User>;

  getUser: (id: string) => Promise<User | undefined>;
  getUserByUsernameOrEmail: (
    usernameOrEmail: string,
  ) => Promise<User | undefined>;
  authenticateUser: (
    usernameOrEmail: string,
    password: string,
  ) => Promise<User | undefined>;

  searchUsers: (options?: SearchUsersOptions) => Promise<User[]>;
}
