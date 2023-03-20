export interface ProfileCertificationData {
  agency?: string;
  course: string;
  date?: string;
}

export interface ProfileData {
  avatar?: string;
  bio?: string;
  birthdate?: string;
  customData?: unknown;
  certifications?: ProfileCertificationData[];
  experienceLevel?: string;
  location?: string;
  name?: string;
  profileVisibility: string;
  startedDiving?: string;
}

export interface Profile extends ProfileData {
  readonly userId: string;
  readonly username: string;
  readonly memberSince: Date;

  save(): Promise<void>;
  toJSON(): object;
}

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
  readonly role: number;
}

export interface User extends UserData {
  readonly profile: Profile;

  changeUsername(newUsername: string): Promise<void>;
  changeEmail(newEmail: string): Promise<void>;
  changeRole(newRole: number): Promise<void>;

  requestEmailVerificationToken(): Promise<string>;
  verifyEmail(token: string): Promise<boolean>;

  changePassword(oldPassword: string, newPassword: string): Promise<boolean>;
  requestPasswordResetToken(): Promise<string>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  forceResetPassword(newPassword: string): Promise<void>;

  lockAccount(): Promise<void>;
  unlockAccount(): Promise<void>;

  updateLastLogin(): Promise<void>;

  toJSON(): Record<string, unknown>;
}

export interface CreateUserOptions {
  username: string;
  email?: string;
  password?: string;
  profileVisibility?: string;
}

export const UsersSortBy = {
  Relevance: 'relevance',
  Username: 'username',
  MemberSince: 'memberSince',
} as const;

export interface SearchUsersOptions {
  query?: string;
  role?: number;
  profileVisibleTo?: string;
  skip?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
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
