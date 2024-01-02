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
});
export type SearchCertificationsParamsDTO = z.infer<
  typeof SearchCertificationsParamsSchema
>;

export const SearchCertificationsResponseSchema = CertificationSchema.array();
export type SearchCertificationsResponseDTO = z.infer<
  typeof SearchCertificationsResponseSchema
>;

export const CreateOrUpdateCertificationParamsSchema = CertificationSchema.omit(
  { id: true },
);
export type CreateOrUpdateCertificationParamsDTO = z.infer<
  typeof CreateOrUpdateCertificationParamsSchema
>;
