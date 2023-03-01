import { SortOrder, type UserRole } from '../constants';

export interface UserData {
  readonly username: string;
  readonly email?: string;
  readonly emailVerified: boolean;
  readonly id: string;
  readonly hasPassword: boolean;
  readonly lastLogin?: Date;
  readonly lastPasswordChange?: Date;
  readonly isLockedOut: boolean;
  readonly memberSince: Date;
  readonly role: UserRole;
}

export interface User extends UserData {
  changeUsername(newUsername: string): Promise<void>;
  changeEmail(newEmail: string): Promise<void>;
  changeRole(newRole: UserRole): Promise<void>;

  requestEmailVerificationToken(): Promise<string>;
  verifyEmail(token: string): Promise<boolean>;

  changePassword(oldPassword: string, newPassword: string): Promise<boolean>;
  requestPasswordResetToken(): Promise<string>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  forceResetPassword(newPassword: string): Promise<void>;

  lockAccount(): Promise<void>;
  unlockAccount(): Promise<void>;

  toJSON(): UserData;
}

export interface CreateUserOptions {
  username: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export enum UsersSortBy {
  Relevance = 'relevance',
  Username = 'username',
  MemberSince = 'memberSince',
}

export interface SearchUsersOptions {
  query?: string;
  role?: UserRole;
  skip?: number;
  limit?: number;
  sortBy?: UsersSortBy;
  sortOrder?: SortOrder;
}

export interface UserManager {
  createUser: (options: CreateUserOptions) => Promise<User>;

  getUser(id: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  authenticateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<User | undefined>;

  searchUsers(options?: SearchUsersOptions): Promise<User[]>;
}
