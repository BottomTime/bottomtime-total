import { z } from 'zod';

import { UserRole } from './constants';
import { PasswordStrengthSchema, UserSchema } from './users';
import { SearchUserProfilesParamsSchema } from './users';

export const AdminSearchUsersParamsSchema =
  SearchUserProfilesParamsSchema.extend({
    role: z.nativeEnum(UserRole).optional(),
  });
export type AdminSearchUsersParamsDTO = z.infer<
  typeof AdminSearchUsersParamsSchema
>;

export const AdminSearchUsersResponseSchema = z.object({
  users: UserSchema.array(),
  totalCount: z.number().int(),
});
export type AdminSearchUsersResponseDTO = z.infer<
  typeof AdminSearchUsersResponseSchema
>;

export const ChangeRoleParamsSchema = z.object({
  newRole: z.nativeEnum(UserRole),
});
export type ChangeRoleParams = z.infer<typeof ChangeRoleParamsSchema>;

export const ResetPasswordParamsSchema = z.object({
  newPassword: PasswordStrengthSchema,
});
export type ResetPasswordParams = z.infer<typeof ResetPasswordParamsSchema>;
