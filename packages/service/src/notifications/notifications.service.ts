import {
  ApiList,
  CreateOrUpdateNotificationParamsDTO,
  GetNotificationsCountParamsDTO,
  ListNotificationsParamsDTO,
  NotificationType,
} from '@bottomtime/api';
import { EventKey } from '@bottomtime/common';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, LessThan, Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';
import { z } from 'zod';

import {
  NotificationEntity,
  NotificationWhitelistEntity,
  UserEntity,
} from '../data';
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
  private readonly _acceptedKeys: Set<string>;

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly Notifications: Repository<NotificationEntity>,

    @InjectRepository(NotificationWhitelistEntity)
    private readonly Whitelists: Repository<NotificationWhitelistEntity>,
  ) {
    this._acceptedKeys = new Set(this.getKeys());
  }

  private treeify(keys: string[], root: string = ''): string[] {
    const children: Record<string, string[]> = {};
    const values: string[] = [];

    for (const key of keys) {
      if (key === '') continue;

      const [parent, ...rest] = key.split('.');
      if (!children[parent]) children[parent] = [];
      children[parent].push(rest.join('.'));
    }

    for (const key of Object.keys(children)) {
      const childValues = this.treeify(
        children[key],
        root ? `${root}.${key}` : key,
      );

      if (childValues.length) {
        values.push(...childValues);
        values.push(root ? `${root}.${key}.*` : `${key}.*`);
        ``;
      } else {
        values.push(root ? `${root}.${key}` : key);
      }
    }

    return values;
  }

  private getKeys(): string[] {
    const keys = this.treeify(Object.values(EventKey));
    keys.push('*');
    return keys;
  }

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

  async getNotificationsCount(
    user: User,
    options: GetNotificationsCountParamsDTO,
  ): Promise<number> {
    const query = new NotificationsQueryBuilder(this.Notifications)
      .withDismissed(options.showDismissed)
      .withRecipient(user)
      .withNewerThan(options.showAfter)
      .build();

    return await query.getCount();
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
    notification.active = new Date(options.active ?? Date.now());
    notification.expires = options.expires ? new Date(options.expires) : null;
    notification.callsToAction = options.callsToAction ?? [];
    notification.dismissed = false;
    notification.recipient = options.user.toEntity();

    await this.Notifications.save(notification);

    return new Notification(this.Notifications, notification);
  }

  async deleteNotifications(
    user: User,
    ids: string | string[],
  ): Promise<number> {
    if (typeof ids === 'string') ids = [ids];
    this.log.debug(`Deleting batch of notifications for user "${user.id}"...`);
    this.log.verbose('Deleting notificaitons:', ids);
    const { affected } = await this.Notifications.delete({
      id: In(ids),
      recipient: { id: user.id } as UserEntity,
    });
    return affected || 0;
  }

  async dismissNotifications(
    user: User,
    ids: string | string[],
  ): Promise<number> {
    if (typeof ids === 'string') ids = [ids];
    const { affected } = await this.Notifications.update(
      {
        recipient: { id: user.id } as UserEntity,
        id: In(ids),
      },
      { dismissed: true },
    );
    return affected || 0;
  }

  async undismissNotifications(
    user: User,
    ids: string | string[],
  ): Promise<number> {
    if (typeof ids === 'string') ids = [ids];
    const { affected } = await this.Notifications.update(
      {
        recipient: { id: user.id } as UserEntity,
        id: In(ids),
      },
      {
        dismissed: false,
      },
    );
    return affected || 0;
  }

  async purgeExpiredNotifications(): Promise<number> {
    this.log.debug('Purging expired notifications...');
    const { affected } = await this.Notifications.delete({
      expires: LessThan(new Date()),
    });
    return typeof affected === 'number' ? affected : 0;
  }

  async getNotificationWhitelist(
    user: User,
    type: NotificationType,
  ): Promise<Set<string>> {
    const result = await this.Whitelists.findOneBy({
      user: { id: user.id },
      type,
    });

    if (!result) return new Set(['*']);

    return new Set(result.whitelist);
  }

  async updateNotificationWhitelist(
    user: User,
    type: NotificationType,
    data: Set<string>,
  ): Promise<void> {
    z.string()
      .refine((value) => this._acceptedKeys.has(value), 'Not a valid event key')
      .array()
      .parse(Array.from(data));

    let entity: NotificationWhitelistEntity | null =
      await this.Whitelists.findOneBy({
        user: { id: user.id },
        type,
      });

    if (!entity) {
      entity = {
        id: uuid(),
        type,
        user: user.toEntity(),
        whitelist: Array.from(data),
      };
    } else {
      entity.whitelist = Array.from(data);
    }

    await this.Whitelists.save(entity);
  }

  async removeNotificationWhitelist(
    user: User,
    type: NotificationType,
  ): Promise<boolean> {
    const { affected } = await this.Whitelists.delete({
      user: { id: user.id },
      type,
    });

    return typeof affected === 'number' && affected > 0;
  }

  isAuthorizedByWhitelist(event: EventKey, whitelist: Set<string>): boolean {
    if (whitelist.has(event)) return true;

    const parts = event.split('.');
    while (parts.length > 0) {
      parts[parts.length - 1] = '*';
      if (whitelist.has(parts.join('.'))) return true;
      parts.pop();
    }

    return false;
  }

  async isNotificationAuthorized(
    user: User,
    type: NotificationType,
    event: EventKey,
  ): Promise<boolean> {
    const whitelist = await this.getNotificationWhitelist(user, type);
    return this.isAuthorizedByWhitelist(event, whitelist);
  }
}
