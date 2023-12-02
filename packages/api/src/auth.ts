import { z } from './zod';

export const LoginParamsSchema = z.object({
  usernameOrEmail: z.string().openapi({
    title: 'Username Or Email',
    example: 'bill_jackson',
  }),
  password: z.string().openapi({
    title: 'Password',
    example: 'T0p_S3Crt.',
  }),
});
export type LoginParams = z.infer<typeof LoginParamsSchema>;
