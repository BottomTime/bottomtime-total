import { z } from 'zod';
import { DateRegex, UserRole } from './constants';

export const UpdateProfileParamsSchema = z
  .object({
    avatar: z.string().trim().url().max(150),
    bio: z.string().trim().max(1000),
    birthdate: z.string().trim().regex(DateRegex),
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
    certifications: z
      .object({
        agency: z.string().trim().max(100).optional(),
        course: z.string().trim().max(200),
        date: z.string().trim().regex(DateRegex).optional(),
      })
      .array()
      .max(200),
    experienceLevel: z.string().trim().max(50),
    location: z.string().trim().max(50),
    name: z.string().trim().max(100),
    startedDiving: z
      .string()
      .trim()
      .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
  })
  .partial();
export type UpdateProfileParams = z.infer<typeof UpdateProfileParamsSchema>;

export const ProfileSchema = UpdateProfileParamsSchema.extend({
  userId: z.string(),
  username: z.string(),
  memberSince: z.coerce.date(),
});
export type ProfileDTO = z.infer<typeof ProfileSchema>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().optional(),
  emailVerified: z.boolean(),
  hasPassword: z.boolean(),
  lastLogin: z.coerce.date().optional(),
  lastPasswordChange: z.coerce.date().optional(),
  isLockedOut: z.boolean(),
  memberSince: z.coerce.date(),
  profile: ProfileSchema,
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
