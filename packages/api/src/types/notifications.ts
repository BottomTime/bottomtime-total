import { z } from 'zod';

export enum NotificationType {
  Email = 'email',
  PushNotification = 'pushNotification',
}

export const CreateOrUpdateNotificationParamsSchema = z.object({
  icon: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
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

export const ListNotificationsParamsSchema = z
  .object({
    showAfter: z.coerce.date(),
    showDismissed: z.coerce.boolean(),
    skip: z.coerce.number().int(),
    limit: z.coerce.number().int(),
  })
  .partial()
  .optional();
export type ListNotificationsParamsDTO = z.infer<
  typeof ListNotificationsParamsSchema
>;

export const ListNotificationsResponseSchema = z.object({
  data: z.array(NotificationSchema),
  totalCount: z.number().int(),
});

export type NotificationWhitelists = Record<NotificationType, string[]>;
