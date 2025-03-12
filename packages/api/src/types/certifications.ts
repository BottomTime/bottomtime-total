import { z } from 'zod';

import { FuzzyDateRegex } from './constants';

export const CreateOrUpdateAgencySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[\w\s]+$/),
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

export const CreateOrUpdateProfessionalAssociationParamsSchema = z.object({
  agency: z.string().uuid(),
  identificationNumber: z.string().trim().max(100),
  title: z.string().trim().min(1).max(200),
  startDate: z.string().trim().regex(FuzzyDateRegex).optional(),
});
export type CreateOrUpdateProfessionalAssociationParamsDTO = z.infer<
  typeof CreateOrUpdateProfessionalAssociationParamsSchema
>;

export const ProfessionalAssociationSchema =
  CreateOrUpdateProfessionalAssociationParamsSchema.omit({
    agency: true,
  }).extend({
    id: z.string().uuid(),
    agency: AgencySchema,
  });
export type ProfessionalAssociationDTO = z.infer<
  typeof ProfessionalAssociationSchema
>;

export const ListAgenciesResponseSchema = z.object({
  data: AgencySchema.array(),
  totalCount: z.number().int(),
});
export const ListProfessionalAssociationsResponseSchema = z.object({
  data: ProfessionalAssociationSchema.array(),
  totalCount: z.number().int(),
});
