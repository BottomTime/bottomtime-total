import { z } from 'zod';

export const CreateOrUpdateAlertParamsSchema = z.object({
  icon: z.string().trim().max(100),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10000),
  active: z.coerce.date().optional(),
  expires: z.coerce.date().optional(),
});
export type CreateOrUpdateAlertParamsDTO = z.infer<
  typeof CreateOrUpdateAlertParamsSchema
>;

export const AlertSchema = CreateOrUpdateAlertParamsSchema.extend({
  id: z.string().uuid(),
});
export type AlertDTO = z.infer<typeof AlertSchema>;

export const ListAlertsParamsSchema = z.object({
  showDismissed: z.coerce.boolean().optional(),
  skip: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});
export type ListAlertsParamsDTO = z.infer<typeof ListAlertsParamsSchema>;

export const ListAlertsResponseSchema = z.object({
  data: z.array(AlertSchema),
  totalCount: z.number().int(),
});
