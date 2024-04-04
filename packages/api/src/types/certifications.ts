import { z } from 'zod';

export const CertificationSchema = z.object({
  id: z.string().uuid(),
  agency: z.string().trim().max(100),
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
  certifications: CertificationSchema.array(),
  totalCount: z.number().int(),
});
export type SearchCertificationsResponseDTO = z.infer<
  typeof SearchCertificationsResponseSchema
>;

export const CreateOrUpdateCertificationParamsSchema = CertificationSchema.omit(
  { id: true },
);
export type CreateOrUpdateCertificationParamsDTO = z.infer<
  typeof CreateOrUpdateCertificationParamsSchema
>;
