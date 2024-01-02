import { UserRole } from './constants';
import { PasswordStrengthSchema } from './users';
import { SearchUsersParamsSchema } from './users';
import { z } from 'zod';

export const AdminSearchUsersParamsSchema = SearchUsersParamsSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
});
export type AdminSearchUsersParams = z.infer<
  typeof AdminSearchUsersParamsSchema
>;

export const ChangeRoleParamsSchema = z.object({
  newRole: z.nativeEnum(UserRole),
});
export type ChangeRoleParams = z.infer<typeof ChangeRoleParamsSchema>;

export const ResetPasswordParamsSchema = z.object({
  newPassword: PasswordStrengthSchema,
});
export type ResetPasswordParams = z.infer<typeof ResetPasswordParamsSchema>;
