import { z } from 'zod';
import { SortOrder } from '../constants';
import { FriendsSortBy } from './interfaces';

export const EmailSchema = z.string().trim().email().max(50);

export const PasswordStrengthSchema = z
  .string()
  .regex(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[~`!@#$%^&*()-_+=}{}[\]<>,./?|\\/]).{8,50}$/,
    'Password did not meet strength requirements.',
  );

export const ListFriendsOptionsSchema = z
  .object({
    sortBy: z.nativeEnum(FriendsSortBy),
    sortOrder: z.nativeEnum(SortOrder),
    skip: z.number().int().min(0),
    limit: z.number().int().positive().max(200),
  })
  .partial();
