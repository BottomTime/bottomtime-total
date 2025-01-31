import { z } from 'zod';

import { AgencySchema } from './agencies';

export const CertificationSchema = z.object({
  id: z.string().uuid(),
  agency: AgencySchema,
  course: z.string().trim().max(200),
});
export type CertificationDTO = z.infer<typeof CertificationSchema>;

export const SearchCertificationsParamsSchema = z.object({
  query: z.string().trim().max(200).optional(),
  agency: z.string().trim().max(100).optional(),
  skip: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().positive().max(400).default(100),
});
export type SearchCertificationsParamsDTO = z.infer<
  typeof SearchCertificationsParamsSchema
>;

export const SearchCertificationsResponseSchema = z.object({
  data: CertificationSchema.array(),
  totalCount: z.number().int(),
});

export const CreateOrUpdateCertificationParamsSchema = CertificationSchema.omit(
  { id: true, agency: true },
).extend({
  agency: z.string().uuid(),
});
export type CreateOrUpdateCertificationParamsDTO = z.infer<
  typeof CreateOrUpdateCertificationParamsSchema
>;
