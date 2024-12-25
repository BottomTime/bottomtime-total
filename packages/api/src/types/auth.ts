import { z } from 'zod';

export const LoginParamsSchema = z.object({
  usernameOrEmail: z.string(),
  password: z.string(),
});
export type LoginParamsDTO = z.infer<typeof LoginParamsSchema>;

export const PurgeJwtInvalidationsRequestSchema = z
  .object({
    invalidatedBefore: z.number(),
  })
  .refine(({ invalidatedBefore }) => invalidatedBefore < Date.now(), {
    message: 'invalidatedBefore must be in the past',
  });
export type PurgeJwtInvalidationsRequestDTO = z.infer<
  typeof PurgeJwtInvalidationsRequestSchema
>;

export const PurgeJwtInvalidationsResultSchema = z.object({
  purged: z.number(),
});
export type PurgeJwtInvalidationsResultDTO = z.infer<
  typeof PurgeJwtInvalidationsResultSchema
>;
