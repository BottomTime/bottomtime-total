import { z } from 'zod';

import { BooleanString } from './constants';

export interface INotificationListener {
  disconnect(): void;
}

export enum NotificationType {
  Email = 'email',
  PushNotification = 'pushNotification',
}

export enum NotificationCallToActionType {
  Link = 'link',
  LinkToNewTab = 'linkToNewTab',
}

export const NotificationCallToActionSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal(NotificationCallToActionType.Link),
      url: z.string(),
    }),
    z.object({
      type: z.literal(NotificationCallToActionType.LinkToNewTab),
      url: z.string(),
    }),
  ])
  .and(z.object({ caption: z.string().min(1).max(100) }));
export type NotificationCallToAction = z.infer<
  typeof NotificationCallToActionSchema
>;

export const CreateOrUpdateNotificationParamsSchema = z.object({
  icon: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  message: z.string().max(2000),
  callsToAction: NotificationCallToActionSchema.array().max(3).optional(),
  active: z.number().optional(),
  expires: z.number().optional(),
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
    showAfter: z.coerce.number(),
    showDismissed: BooleanString,
    skip: z.coerce.number().int(),
    limit: z.coerce.number().int(),
  })
  .partial();
export type ListNotificationsParamsDTO = z.infer<
  typeof ListNotificationsParamsSchema
>;

export const GetNotificationsCountParamsSchema =
  ListNotificationsParamsSchema.omit({
    skip: true,
    limit: true,
  });
export type GetNotificationsCountParamsDTO = z.infer<
  typeof GetNotificationsCountParamsSchema
>;

export const ListNotificationsResponseSchema = z.object({
  data: z.array(NotificationSchema),
  totalCount: z.number().int(),
});

export type NotificationWhitelists = Record<NotificationType, string[]>;
