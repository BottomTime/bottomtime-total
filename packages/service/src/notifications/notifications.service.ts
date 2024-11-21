import {
  ApiList,
  CreateOrUpdateNotificationParamsDTO,
  ListNotificationsParamsDTO,
} from '@bottomtime/api';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { LessThan, Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { NotificationEntity } from '../data';
import { User } from '../users/user';
import { Notification } from './notification';
import { NotificationsQueryBuilder } from './notifications-query-builder';

export type ListNotificationsOptions = ListNotificationsParamsDTO & {
  user: User;
};

export type CreateNotificationOptions = CreateOrUpdateNotificationParamsDTO & {
  user: User;
};

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly Notifications: Repository<NotificationEntity>,
  ) {}

  async listNotifications(
    options: ListNotificationsOptions,
  ): Promise<ApiList<Notification>> {
    const query = new NotificationsQueryBuilder(this.Notifications)
      .withDismissed(options.showDismissed)
      .withRecipient(options.user)
      .withNewerThan(options.showAfter)
      .withPagination(options.skip, options.limit)
      .build();

    this.log.debug(
      `Requesting notifications for user with ID "${options.user.id}"...`,
    );
    this.log.verbose(query.getSql());

    const [results, totalCount] = await query.getManyAndCount();

    return {
      data: results.map(
        (notification) => new Notification(this.Notifications, notification),
      ),
      totalCount,
    };
  }

  async getNotification(
    userId: string,
    notificationid: string,
  ): Promise<Notification | undefined> {
    const notification = await this.Notifications.findOneBy({
      id: notificationid,
      recipient: { id: userId },
    });

    if (notification) return new Notification(this.Notifications, notification);
    else return undefined;
  }

  async createNotification(
    options: CreateNotificationOptions,
  ): Promise<Notification> {
    const notification = new NotificationEntity();
    notification.id = uuid();
    notification.icon = options.icon;
    notification.title = options.title;
    notification.message = options.message;
    notification.active = options.active ?? new Date();
    notification.expires = options.expires ?? null;
    notification.dismissed = false;
    notification.recipient = options.user.toEntity();

    await this.Notifications.save(notification);

    return new Notification(this.Notifications, notification);
  }

  async purgeExpiredNotifications(): Promise<number> {
    this.log.debug('Purging expired notifications...');
    const { affected } = await this.Notifications.delete({
      expires: LessThan(new Date()),
    });
    return typeof affected === 'number' ? affected : 0;
  }
}
