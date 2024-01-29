import { z } from 'zod';

export const LoginParamsSchema = z.object({
  usernameOrEmail: z.string(),
  password: z.string(),
});
export type LoginParamsDTO = z.infer<typeof LoginParamsSchema>;
