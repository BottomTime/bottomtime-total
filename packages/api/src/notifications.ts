import { z } from 'zod';

export const CreateOrUpdateNotificationParamsSchema = z.object({
  icon: z.string().max(100),
  title: z.string().max(200),
  message: z.string().max(2000),
  active: z.coerce.date().optional(),
  expires: z.coerce.date().optional(),
});
export type CreateOrUpdateNotificationParamsDTO = z.infer<
  typeof CreateOrUpdateNotificationParamsSchema
>;

export const NotificationSchema = CreateOrUpdateNotificationParamsSchema.extend(
  {
    id: z.string().uuid(),
    dismissed: z.boolean(),
  },
);
export type NotificationDTO = z.infer<typeof NotificationSchema>;

export const ListNotificationsParamsSchema = z.object({
  showDismissed: z.boolean().optional(),
  skip: z.number().int().optional(),
  limit: z.number().int().optional(),
});
export type ListNotificationsParamsDTO = z.infer<
  typeof ListNotificationsParamsSchema
>;

export const ListNotificationsResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
  totalCount: z.number().int(),
});
export type ListNotificationsResponseDTO = z.infer<
  typeof ListNotificationsResponseSchema
>;
