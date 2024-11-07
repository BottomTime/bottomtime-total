import { z } from 'zod';

import {
  BooleanString,
  DepthUnit,
  FuzzyDateRegex,
  PressureUnit,
  SortOrder,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from './constants';
import { AccountTier } from './memberships';

export enum UsersSortBy {
  Username = 'username',
  MemberSince = 'memberSince',
}

export enum LogBookSharing {
  Public = 'public',
  Private = 'private',
  FriendsOnly = 'friends',
}

export enum PasswordResetTokenStatus {
  Valid = 'valid',
  Invalid = 'invalid',
  Expired = 'expired',
}

export const UsernameRegex = /^[a-z0-9_.-]+$/i;
export const PasswordStrengthRegex =
  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[~`!@#$%^&*()-_+=}{}[\]<>,./?|\\/]).{8,50}$/;

export const UsernameSchema = z
  .string()
  .trim()
  .regex(UsernameRegex)
  .min(3)
  .max(50);
export const EmailSchema = z.string().trim().email().max(50);
export const PasswordStrengthSchema = z
  .string()
  .regex(PasswordStrengthRegex, 'Password did not meet strength requirements.');

export const UpdateProfileParamsSchema = z
  .object({
    avatar: z.string().trim().url().nullable(),
    bio: z.string().trim().max(1000).nullable(),
    experienceLevel: z.string().trim().max(50).nullable(),
    location: z.string().trim().max(50).nullable(),
    name: z.string().trim().max(100).nullable(),
    startedDiving: z.string().trim().regex(FuzzyDateRegex).nullable(),
    logBookSharing: z.nativeEnum(LogBookSharing).optional(),
  })
  .partial();
export type UpdateProfileParamsDTO = z.infer<typeof UpdateProfileParamsSchema>;

export const ProfileSchema = UpdateProfileParamsSchema.omit({
  logBookSharing: true,
}).extend({
  userId: z.string(),
  accountTier: z.nativeEnum(AccountTier),
  username: UsernameSchema,
  memberSince: z.coerce.date(),
  logBookSharing: z.nativeEnum(LogBookSharing).default(LogBookSharing.Private),
  avatar: z.string().nullable().optional(),
});
export type ProfileDTO = z.infer<typeof ProfileSchema>;

export const SuccinctProfileSchema = ProfileSchema.pick({
  userId: true,
  accountTier: true,
  memberSince: true,
  username: true,
  avatar: true,
  name: true,
  location: true,
  logBookSharing: true,
});
export type SuccinctProfileDTO = z.infer<typeof SuccinctProfileSchema>;

export const UserSettingsSchema = z.object({
  depthUnit: z.nativeEnum(DepthUnit),
  pressureUnit: z.nativeEnum(PressureUnit),
  temperatureUnit: z.nativeEnum(TemperatureUnit),
  weightUnit: z.nativeEnum(WeightUnit),
});
export type UserSettingsDTO = z.infer<typeof UserSettingsSchema>;

export const CreateUserOptionsSchema = z.object({
  username: UsernameSchema,
  email: EmailSchema.optional(),
  password: PasswordStrengthSchema.optional(),
  role: z.nativeEnum(UserRole).optional(),
  profile: UpdateProfileParamsSchema.optional(),
  settings: UserSettingsSchema.partial().optional(),
});
export type CreateUserParamsDTO = z.infer<typeof CreateUserOptionsSchema>;

export const ChangeUsernameParamsSchema = z.object({
  newUsername: UsernameSchema,
});
export type ChangeUsernameParamsDTO = z.infer<
  typeof ChangeUsernameParamsSchema
>;

export const ChangeEmailParamsSchema = z.object({
  newEmail: EmailSchema,
});
export type ChangeEmailParamsDTO = z.infer<typeof ChangeEmailParamsSchema>;

export const ChangePasswordParamsSchema = z.object({
  oldPassword: z.string(),
  newPassword: PasswordStrengthSchema,
});
export type ChangePasswordParamsDTO = z.infer<
  typeof ChangePasswordParamsSchema
>;

export const ResetPasswordWithTokenParamsSchema = z.object({
  token: z.string().min(1),
  newPassword: PasswordStrengthSchema,
});
export type ResetPasswordWithTokenParamsDTO = z.infer<
  typeof ResetPasswordWithTokenParamsSchema
>;

export const UserSchema = z.object({
  id: z.string(),
  accountTier: z.nativeEnum(AccountTier),
  username: z.string(),
  email: EmailSchema.optional(),
  emailVerified: z.boolean(),
  hasPassword: z.boolean(),
  lastLogin: z.coerce.date().optional(),
  lastPasswordChange: z.coerce.date().optional(),
  isLockedOut: z.boolean(),
  memberSince: z.coerce.date(),
  profile: ProfileSchema,
  settings: UserSettingsSchema,
  role: z.nativeEnum(UserRole),
});
export type UserDTO = z.infer<typeof UserSchema>;

export const CurrentUserSchema = z.discriminatedUnion('anonymous', [
  z.object({ anonymous: z.literal(true) }),
  UserSchema.extend({
    anonymous: z.literal(false),
  }),
]);
export type CurrentUserDTO = z.infer<typeof CurrentUserSchema>;

export const SearchUserProfilesParamsSchema = z
  .object({
    filterFriends: BooleanString,
    query: z.string().trim().max(200),
    sortBy: z.nativeEnum(UsersSortBy),
    sortOrder: z.nativeEnum(SortOrder),
    skip: z.coerce.number().int().min(0),
    limit: z.coerce.number().int().positive().max(200),
  })
  .partial();
export type SearchUserProfilesParamsDTO = z.infer<
  typeof SearchUserProfilesParamsSchema
>;

export const SearchUsersResponseSchema = z.object({
  data: UserSchema.array(),
  totalCount: z.number().int(),
});

export const SearchProfilesResponseSchema = z.object({
  data: ProfileSchema.array(),
  totalCount: z.number().int(),
});

export const VerifyEmailParamsSchema = z.object({
  token: z.string().min(1),
});
export type VerifyEmailParamsDTO = z.infer<typeof VerifyEmailParamsSchema>;

export const ValidateResetPasswordTokenResponseSchema = z.object({
  status: z.nativeEnum(PasswordResetTokenStatus),
});
export type ValidateResetPasswordTokenResponseDTO = z.infer<
  typeof ValidateResetPasswordTokenResponseSchema
>;
