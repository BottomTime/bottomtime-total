export interface ProfileCertificationData {
  agency?: string;
  course: string;
  date?: string;
}

export interface ProfileData {
  avatar?: string;
  bio?: string;
  birthdate?: string;
  customData?: object;
  certifications?: ProfileCertificationData[];
  experienceLevel?: string;
  location?: string;
  name?: string;
  profileVisibility: string;
  startedDiving?: string;
}

export interface UserData {
  readonly id: string;
  readonly email?: string;
  readonly emailVerified: boolean;
  readonly hasPassword: boolean;
  readonly isLockedOut: boolean;
  readonly lastLogin?: Date;
  readonly lastPasswordChange?: Date;
  readonly memberSince: Date;
  readonly role: number;
  readonly username: string;

  readonly profile: ProfileData;
}

export interface Profile extends ProfileData {
  readonly userId: string;
  readonly username: string;
  readonly memberSince: Date;

  save(): Promise<void>;
  toJSON(): object;
}

export interface User extends UserData {
  readonly profile: Profile;

  changeEmail(newEmail: string): Promise<void>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  changeUsername(newUsername: string): Promise<void>;
  requestVerificationEmail(): Promise<void>;
  verifyEmail(token: string): Promise<boolean>;

  toJSON(): UserData;
}

export interface CreateUserOptions {
  username: string;
  password?: string;
  email?: string;
}

export interface UserManager {
  authenticateUser(usernameOrEmail: string, password: string): Promise<User>;
  createUser(options: CreateUserOptions): Promise<User>;
  getCurrentUser(): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User>;
  isUsernameOrEmailAvailable(usernameOrEmail: string): Promise<boolean>;
  requestPasswordReset(usernameOrEmail: string): Promise<void>;
  resetPassword(
    username: string,
    token: string,
    newPassword: string,
  ): Promise<void>;
}
