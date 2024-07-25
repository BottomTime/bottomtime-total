import { z } from 'zod';

export const FeatureKeyRegex = /^[a-z0-9]+(_[a-z0-9]+)*$/;
export const FeatureKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(FeatureKeyRegex);

export const CreateOrUpdateFeatureSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  enabled: z.boolean(),
});
export type CreateOrUpdateFeatureDTO = z.infer<
  typeof CreateOrUpdateFeatureSchema
>;

export const FeatureSchema = CreateOrUpdateFeatureSchema.extend({
  key: FeatureKeySchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type FeatureDTO = z.infer<typeof FeatureSchema>;

export const ToggleFeatureSchema = z
  .object({
    enabled: z.boolean().optional(),
  })
  .optional();
export type ToggleFeatureDTO = z.infer<typeof ToggleFeatureSchema>;
