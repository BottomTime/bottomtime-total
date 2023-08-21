import { z } from 'zod';

export const ApplicationSchema = z.object({
  _id: z.string().uuid(),
  active: z.boolean(),
  allowedOrigins: z.array(z.string().trim()).optional(),
  created: z.date(),
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(200).optional(),
  token: z.string().trim().min(20).max(50),
  user: z.string().uuid(),
});
export type ApplicationDocument = z.infer<typeof ApplicationSchema>;
