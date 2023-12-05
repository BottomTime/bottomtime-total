import { UserRole } from './constants';
import { PasswordStrengthSchema } from './user';
import { SearchUsersParamsSchema } from './users';
import { z } from './zod';

export const AdminSearchUsersParamsSchema = SearchUsersParamsSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
});
export type AdminSearchUsersParams = z.infer<
  typeof AdminSearchUsersParamsSchema
>;

export const ChangeRoleParamsSchema = z.object({
  newRole: z.nativeEnum(UserRole).openapi({
    title: 'New Role',
    description:
      'The new role to assign to the user. Note: Only administrators may set this to a value other than `user`',
    example: UserRole.Admin,
  }),
});
export type ChangeRoleParams = z.infer<typeof ChangeRoleParamsSchema>;

export const ResetPasswordParamsSchema = z.object({
  newPassword: PasswordStrengthSchema,
});
export type ResetPasswordParams = z.infer<typeof ResetPasswordParamsSchema>;
