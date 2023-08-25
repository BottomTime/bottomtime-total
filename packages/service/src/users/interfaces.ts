import { z } from 'zod';
import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  SortOrder,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '../constants';
import { ProfileSchema, UsernameSchema } from '../data';

export enum UsersSortBy {
  Username = 'username',
  MemberSince = 'memberSince',
}

export enum FriendsSortBy {
  Username = 'username',
  MemberSince = 'memberSince',
  FriendsSince = 'friendsSince',
}

export const EmailSchema = z.string().trim().email().max(50);
export const PasswordStrengthSchema = z
  .string()
  .regex(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[~`!@#$%^&*()-_+=}{}[\]<>,./?|\\/]).{8,50}$/,
    'Password did not meet strength requirements.',
  );

export const SearchUsersOptionsSchema = z
  .object({
    query: z.string().trim(),
    role: z.nativeEnum(UserRole),
    profileVisibleTo: z.union([z.literal('public'), UsernameSchema]),
    sortBy: z.nativeEnum(UsersSortBy),
    sortOrder: z.nativeEnum(SortOrder),
    skip: z.coerce.number().int().min(0),
    limit: z.coerce.number().int().positive().max(200),
  })
  .partial();
export type SearchUsersOptions = z.infer<typeof SearchUsersOptionsSchema>;

export const ListFriendsOptionsSchema = z
  .object({
    sortBy: z.nativeEnum(FriendsSortBy),
    sortOrder: z.nativeEnum(SortOrder),
    skip: z.number().int().min(0),
    limit: z.number().int().positive().max(200),
  })
  .partial();
export type ListFriendsOptions = z.infer<typeof ListFriendsOptionsSchema>;

export interface ProfileCertificationData {
  agency?: string;
  course: string;
  date?: string;
}

export interface ProfileData {
  avatar?: string;
  bio?: string;
  birthdate?: string;
  customData?: Record<string, unknown>;
  certifications?: ProfileCertificationData[];
  experienceLevel?: string;
  location?: string;
  name?: string;
  profileVisibility: ProfileVisibility;
  startedDiving?: string;
}

export interface Profile extends ProfileData {
  readonly userId: string;
  readonly username: string;
  readonly memberSince: Date;

  save(): Promise<void>;
  toJSON(): object;
}

export const CreateUserOptionsSchema = z.object({
  username: UsernameSchema,
  email: EmailSchema.optional(),
  password: PasswordStrengthSchema.optional(),
  role: z.nativeEnum(UserRole).optional(),
  profile: ProfileSchema.optional(),
});
export type CreateUserOptions = z.infer<typeof CreateUserOptionsSchema>;

export interface UserSettingsData {
  depthUnit: DepthUnit;
  pressureUnit: PressureUnit;
  temperatureUnit: TemperatureUnit;
  weightUnit: WeightUnit;
}

export interface UserSettings extends UserSettingsData {
  save(): Promise<void>;
  toJSON(): Record<string, unknown>;
}

export interface Friend {
  readonly friend: Profile;
  readonly friendsSince: Date;
}

export interface FriendsManager {
  addFriend(friend: Profile): Promise<Friend>;
  isFriendsWith(friendId: string): Promise<boolean>;
  listFriends(options?: ListFriendsOptions): Promise<Friend[]>;
  removeFriend(friendId: string): Promise<void>;
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
  readonly role: UserRole;
}

export interface User extends UserData {
  readonly displayName: string;
  readonly friends: FriendsManager;
  readonly profile: Profile;
  readonly settings: UserSettings;

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

  updateLastLogin(): Promise<void>;

  toJSON(): Record<string, unknown>;
}

export interface UserManager {
  createUser(options: CreateUserOptions): Promise<User>;

  getUser(id: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  authenticateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<User | undefined>;

  searchUsers(options?: SearchUsersOptions): Promise<User[]>;
}
