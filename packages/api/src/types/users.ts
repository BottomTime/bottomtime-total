import { z } from 'zod';

import {
  DepthUnit,
  FuzzyDateRegex,
  PressureUnit,
  SortOrder,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from './constants';

export enum UsersSortBy {
  Username = 'username',
  MemberSince = 'memberSince',
}

export const UsernameRegex = /^[a-z0-9]+([_.-][a-z0-9]+)*$/i;
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
    bio: z.string().trim().max(1000).nullable(),
    birthdate: z.string().trim().regex(FuzzyDateRegex).nullable(),
    customData: z
      .record(z.string(), z.unknown())
      .refine(
        (json) => Buffer.from(JSON.stringify(json)).byteLength <= 1048576,
        {
          message:
            'Custom data blob cannot be greater than 1Mb (1,048,576 bytes).',
          path: ['customData'],
        },
      ),
    experienceLevel: z.string().trim().max(50).nullable(),
    location: z.string().trim().max(50).nullable(),
    name: z.string().trim().max(100).nullable(),
    startedDiving: z.string().trim().regex(FuzzyDateRegex).nullable(),
  })
  .partial();
export type UpdateProfileParamsDTO = z.infer<typeof UpdateProfileParamsSchema>;

export const ProfileSchema = UpdateProfileParamsSchema.extend({
  userId: z.string(),
  username: UsernameSchema,
  memberSince: z.coerce.date(),
  avatar: z.string().nullable().optional(),
});
export type ProfileDTO = z.infer<typeof ProfileSchema>;

const SuccinctProfileSchema = ProfileSchema.pick({
  userId: true,
  memberSince: true,
  username: true,
  avatar: true,
  name: true,
  location: true,
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

export const SearchUserProfilesParamsSchema = z.object({
  query: z.string().trim().max(200).optional(),
  sortBy: z.nativeEnum(UsersSortBy).default(UsersSortBy.Username),
  sortOrder: z.nativeEnum(SortOrder).default(SortOrder.Ascending),
  skip: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().positive().max(200).default(100),
});
export type SearchUserProfilesParamsDTO = z.infer<
  typeof SearchUserProfilesParamsSchema
>;

export const SearchUsersResponseSchema = z.object({
  users: UserSchema.array(),
  totalCount: z.number().int(),
});
export type SearchUsersResponseDTO = z.infer<typeof SearchUsersResponseSchema>;

export const SearchProfilesResponseSchema = z.object({
  users: ProfileSchema.array(),
  totalCount: z.number().int(),
});
export type SearchProfilesResponseDTO = z.infer<
  typeof SearchProfilesResponseSchema
>;

export const VerifyEmailParamsSchema = z.object({
  token: z.string().min(1),
});
export type VerifyEmailParamsDTO = z.infer<typeof VerifyEmailParamsSchema>;

export const SetProfileAvatarParamsSchema = z.union([
  z.object({
    avatar: z.unknown(),
    left: z.coerce.number().int().min(0),
    top: z.coerce.number().int().min(0),
    width: z.coerce.number().int().min(1),
    height: z.coerce.number().int().min(1),
  }),
  z.object({ avatar: z.unknown() }),
]);
export type SetProfileAvatarParamsDTO = z.infer<
  typeof SetProfileAvatarParamsSchema
>;
