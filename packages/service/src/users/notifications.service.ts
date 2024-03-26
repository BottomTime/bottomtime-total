import {
  CreateOrUpdateNotificationParamsDTO,
  ListNotificationsParamsDTO,
} from '@bottomtime/api';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { LessThan, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { NotificationEntity, UserEntity } from '../data';
import { Notification } from './notification';

export type ListNotificationsOptions = ListNotificationsParamsDTO & {
  userId: string;
};

export type ListNotificationsResult = {
  notifications: Notification[];
  totalCount: number;
};

export type CreateNotificationOptions = CreateOrUpdateNotificationParamsDTO & {
  userId: string;
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
  ): Promise<ListNotificationsResult> {
    let query = this.Notifications.createQueryBuilder('notifications')
      .where('notifications.recipient = :recipientId', {
        recipientId: options.userId,
      })
      .orderBy('notifications.active', 'DESC')
      .offset(options.skip ?? 0)
      .limit(options.limit ?? 50);

    if (!options.showDismissed) {
      query = query.andWhere('notifications.dismissed = FALSE');
    }

    this.log.debug(
      `Requesting notifications for user with ID "${options.userId}"...`,
    );
    this.log.verbose(query.getSql());

    const [results, totalCount] = await query.getManyAndCount();

    return {
      notifications: results.map(
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
    notification.recipient = { id: options.userId } as UserEntity;

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
