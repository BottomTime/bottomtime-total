import { z } from 'zod';

export const ReviewChangedQueueMessageSchema = z.object({
  entity: z.enum(['diveSite', 'operator']),
  id: z.string().uuid(),
});
export type ReviewChangedMessage = z.infer<
  typeof ReviewChangedQueueMessageSchema
>;
