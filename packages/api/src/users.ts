import { z } from './zod';
import { DateRegex, UserRole } from './constants';

export const UsernameSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+([_.-][a-z0-9]+)*$/i)
  .min(3)
  .max(50);
export const EmailSchema = z.string().trim().email().max(50);
export const PasswordStrengthSchema = z
  .string()
  .regex(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[~`!@#$%^&*()-_+=}{}[\]<>,./?|\\/]).{8,50}$/,
    'Password did not meet strength requirements.',
  );

export const UpdateProfileParamsSchema = z
  .object({
    avatar: z.string().trim().url().max(150).openapi({
      title: 'Avatar',
      describe:
        "A URL to an image that can be displayed as the diver's avatar.",
      example: 'https://gravatar.com/rob_diver',
    }),
    bio: z.string().trim().max(1000).openapi({
      title: 'Bio',
      description:
        'A brief blurb about the diver that the he/she/they would like to share with those who view their profile.',
      example: 'Loves diving. Especially on reefs.',
    }),
    birthdate: z.string().trim().regex(DateRegex).openapi({
      title: 'Birthdate',
      description:
        "The diver's birthdate. Can be formatted as `yyyy`, `yyyy-mm`, or `yyyy-mm-dd`.",
      example: '1991-02-04',
    }),
    customData: z
      .record(z.string(), z.unknown())
      .refine(
        (json) => Buffer.from(JSON.stringify(json)).byteLength <= 1048576,
        {
          message:
            'Custom data blob cannot be greater than 1Mb (1,048,576 bytes).',
          path: ['customData'],
        },
      )
      .openapi({
        title: 'Custom data',
        description:
          'Can be used to store arbitrary custom metadata about the user. This blob can be no larger than 1Mb.',
      }),
    certifications: z
      .object({
        agency: z.string().trim().max(100).optional().openapi({
          title: 'Agency',
          description: 'Name of the agency that granted the certification.',
          example: 'PADI',
        }),
        course: z.string().trim().max(200).openapi({
          title: 'Course Name',
          description: 'Name of the course or certification.',
          example: 'Deep Diver',
        }),
        date: z.string().trim().regex(DateRegex).optional().openapi({
          title: 'Date Received',
          description: 'The date on which the certification was received.',
          example: '2015-11-02',
        }),
      })
      .array()
      .max(200)
      .openapi({
        title: 'Certifications',
        description:
          'A collection of diving certifications earned by the diver over their career.',
      }),
    experienceLevel: z.string().trim().max(50).openapi({
      title: 'Experience Level',
      description: "The diver's current experience level.",
      example: 'Novice',
    }),
    location: z.string().trim().max(50).openapi({
      title: 'Location',
      description: 'Where the diver is located.',
      example: 'Los Angeles, CA',
    }),
    name: z.string().trim().max(100).openapi({
      title: 'Display Name',
      description:
        'The display name the diver would like to show on the site to other users',
      example: 'Rob H. Diver',
    }),
    startedDiving: z
      .string()
      .trim()
      .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/)
      .openapi({
        title: 'Started Diving',
        description: 'When the diver first began diving.',
        example: '2012',
      }),
  })
  .partial();
export type UpdateProfileParams = z.infer<typeof UpdateProfileParamsSchema>;

export const ProfileSchema = UpdateProfileParamsSchema.extend({
  userId: z.string(),
  username: z.string(),
  memberSince: z.coerce.date(),
});
export type ProfileDTO = z.infer<typeof ProfileSchema>;

export const CreateUserOptionsSchema = z.object({
  username: UsernameSchema.openapi({
    title: 'Username',
    description: 'The username to assign to the new user account',
    example: 'RobDiver17',
  }),
  email: EmailSchema.optional().openapi({
    title: 'Email',
    description: 'The email address of the owner of the new account.',
    example: 'robdiver17@gmail.com',
  }),
  password: PasswordStrengthSchema.optional().openapi({
    title: 'Password',
    description:
      'The password to be used to secure the new account. It must meet minimum strength requirements.',
  }),
  role: z.nativeEnum(UserRole).optional().openapi({
    title: 'User Role',
    description:
      'The security role to assign to the new user account. Note: Only administrators may set this to a value other than `user`',
  }),
  profile: UpdateProfileParamsSchema.optional().openapi({
    title: 'Profile',
    description: "The user's profile information.",
  }),
});
export type CreateUserOptions = z.infer<typeof CreateUserOptionsSchema>;

export const UserSchema = z.object({
  id: z.string().uuid().openapi({
    title: 'ID',
    description:
      'The globally-unique ID that uniquely identifies this user account',
  }),
  username: z.string().openapi({
    title: 'Username',
    description: "The user's unique username.",
    example: 'RobDiver17',
  }),
  email: EmailSchema.optional().openapi({
    title: 'Email',
    description: "The user's email address.",
    example: 'robdiver17@gmail.com',
  }),
  emailVerified: z.boolean().openapi({
    title: 'Verified Email',
    description: "True if the user's email address has been verified.",
  }),
  hasPassword: z.boolean().openapi({
    title: 'Has Password',
    description: 'True if the user has a password set on their account.',
  }),
  lastLogin: z.coerce.date().optional().openapi({
    title: 'Last Login',
    description: "Date and time of the user's last login.",
  }),
  lastPasswordChange: z.coerce.date().optional().openapi({
    title: 'Last Password Change',
    description:
      'The date and time at which the user last changed their password.',
  }),
  isLockedOut: z.boolean().openapi({
    title: 'Is Locked Out',
    description:
      "True if the user's account has been suspended/locked. The user will not be able to authenticate or make API requests if this is true.",
  }),
  memberSince: z.coerce.date().openapi({
    title: 'Member Since',
    description: 'Date and time at which the user account was first created.',
  }),
  profile: ProfileSchema.openapi({
    title: 'Profile',
    description: "The user's profile settings.",
  }),
  role: z.nativeEnum(UserRole).openapi({
    title: 'Role',
    description: "The user's security role.",
  }),
});
export type UserDTO = z.infer<typeof UserSchema>;

export const CurrentUserSchema = z.discriminatedUnion('anonymous', [
  z.object({ anonymous: z.literal(true) }),
  UserSchema.extend({
    anonymous: z.literal(false),
  }),
]);
export type CurrentUserDTO = z.infer<typeof CurrentUserSchema>;
