import { z } from 'zod';

export const CreateOrUpdateAgencySchema = z.object({
  name: z.string().trim().min(1).max(200),
  longName: z.string().trim().max(200).optional(),
  logo: z.string().trim().min(1).max(250),
  website: z.string().trim().url().max(250),
});
export type CreateOrUpdateAgencyDTO = z.infer<
  typeof CreateOrUpdateAgencySchema
>;

export const AgencySchema = CreateOrUpdateAgencySchema.extend({
  id: z.string().uuid(),
});
export type AgencyDTO = z.infer<typeof AgencySchema>;
