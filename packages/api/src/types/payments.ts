import { z } from 'zod';

export const CreatePaymentSessionResponseSchema = z.object({
  clientSecret: z.string(),
});
export type CreatePaymentSessionResponseDTO = z.infer<
  typeof CreatePaymentSessionResponseSchema
>;
