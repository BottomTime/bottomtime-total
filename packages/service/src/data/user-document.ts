import { z } from 'zod';

import {
  DateRegex,
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TankMaterial,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '../constants';

export const UsernameSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+([_.-][a-z0-9]+)*$/i)
  .min(3)
  .max(50);

export const ProfileCertificationSchema = z.object({
  agency: z.string().trim().max(100).optional(),
  course: z.string().trim().max(200),
  date: z.string().trim().regex(DateRegex).optional(),
});
export type ProfileCertification = z.infer<typeof ProfileCertificationSchema>;

export const ProfileSchema = z.object({
  avatar: z.string().trim().url().max(150).optional(),
  bio: z.string().trim().max(1000).optional(),
  birthdate: z.string().trim().regex(DateRegex).optional(),
  customData: z
    .object({})
    .passthrough()
    .refine((json) => Buffer.from(JSON.stringify(json)).byteLength <= 1048576, {
      message: 'Custom data blob cannot be greater than 1048576 bytes.',
      path: ['customData'],
    })
    .optional(),
  certifications: z.array(ProfileCertificationSchema).max(200).optional(),
  experienceLevel: z.string().trim().max(50).optional(),
  location: z.string().trim().max(50).optional(),
  name: z.string().trim().max(100).optional(),
  profileVisibility: z.nativeEnum(ProfileVisibility),
  startedDiving: z
    .string()
    .trim()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/)
    .optional(),
});
export type ProfileDocument = z.infer<typeof ProfileSchema>;

export const UserDefinedTankSchema = z.object({
  _id: z.string().uuid(),
  name: z.string().trim().max(200),
  material: z.nativeEnum(TankMaterial),
  workingPressure: z.number().positive(),
  volume: z.number().positive(),
});
export type UserDefinedTankDocument = z.infer<typeof UserDefinedTankSchema>;

export const FriendSchema = z.object({
  friendId: z.string().uuid(),
  friendsSince: z.date(),
});
export type FriendDocument = z.infer<typeof FriendSchema>;

export const UserSettingsSchema = z
  .object({
    depthUnit: z.nativeEnum(DepthUnit).default(DepthUnit.Meters),
    pressureUnit: z.nativeEnum(PressureUnit).default(PressureUnit.Bar),
    temperatureUnit: z
      .nativeEnum(TemperatureUnit)
      .default(TemperatureUnit.Celsius),
    weightUnit: z.nativeEnum(WeightUnit).default(WeightUnit.Kilograms),
  })
  .partial();

export const UserSchema = z.object({
  _id: z.string().uuid(),
  email: z.string().trim().email().optional(),
  emailLowered: z.string().trim().email().toLowerCase().optional(),
  emailVerified: z.boolean().default(false),
  emailVerificationToken: z.string().optional(),
  emailVerificationTokenExpiration: z.date().optional(),
  isLockedOut: z.boolean().default(false),
  lastLogin: z.date().optional(),
  lastPasswordChange: z.date().optional(),
  memberSince: z.date().default(() => new Date()),
  oauthIds: z
    .object({
      github: z.string(),
      google: z.string(),
    })
    .partial()
    .optional(),
  passwordHash: z.string().optional(),
  passwordResetToken: z.string().optional(),
  passwordResetTokenExpiration: z.date().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.User),
  username: UsernameSchema,
  usernameLowered: UsernameSchema.toLowerCase(),

  profile: ProfileSchema.optional(),

  settings: UserSettingsSchema.optional(),

  tanks: z.array(UserDefinedTankSchema).optional(),

  friends: z.array(FriendSchema).optional(),
});
export type UserDocument = z.infer<typeof UserSchema>;
