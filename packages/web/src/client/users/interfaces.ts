import { ProfileVisibility, UserRole } from '@/constants';
import { z } from 'zod';

export const ProfileCertificationDataSchema = z.object({
  agency: z.string().optional(),
  course: z.string(),
  date: z.coerce.date().optional(),
});
export type ProfileCertificationData = z.infer<
  typeof ProfileCertificationDataSchema
>;

export const ProfileDataSchema = z.object({
  avatar: z.string().optional(),
  bio: z.string().optional(),
  birthdate: z.string().optional(),
  customData: z.record(z.string(), z.unknown()).optional(),
  certifications: z.array(ProfileCertificationDataSchema).optional(),
  experienceLevel: z.string().optional(),
  location: z.string().optional(),
  name: z.string().optional(),
  profileVisibility: z.nativeEnum(ProfileVisibility),
  startedDiving: z.string().optional(),
});
export type ProfileData = z.infer<typeof ProfileDataSchema>;

export const UserDataSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  emailVerified: z.coerce.boolean(),
  hasPassword: z.coerce.boolean(),
  isLockedOut: z.coerce.boolean(),
  lastLogin: z.coerce.date().optional(),
  lastPasswordChange: z.coerce.date().optional(),
  memberSince: z.coerce.date(),
  role: z.nativeEnum(UserRole),
  username: z.string(),

  profile: ProfileDataSchema,
});
export type UserData = z.infer<typeof UserDataSchema>;

export interface Profile extends ProfileData {
  readonly userId: string;
  readonly username: string;
  readonly memberSince: Date;

  save(): Promise<void>;
  toJSON(): object;
}

export interface User extends Readonly<UserData> {
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
  profile?: ProfileData;
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
  ): Promise<boolean>;
}
