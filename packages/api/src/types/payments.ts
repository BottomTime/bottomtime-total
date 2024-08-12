import { z } from 'zod';

import { AccountTier } from './users';

export const CreatePaymentSessionSchema = z.object({
  accountTier: z.nativeEnum(AccountTier),
});
export type CreatePaymentSessionDTO = z.infer<
  typeof CreatePaymentSessionSchema
>;

export const CreatePaymentSessionResponseSchema = z.object({
  clientSecret: z.string(),
});
export type CreatePaymentSessionResponseDTO = z.infer<
  typeof CreatePaymentSessionResponseSchema
>;

export const PaymentSessionSchema = z.object({
  sessionId: z.string(),
  user: z.object({
    userId: z.string(),
    email: z.string(),
  }),
  status: z.string(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
});
export type PaymentSessionDTO = z.infer<typeof PaymentSessionSchema>;
