import { Repository, SelectQueryBuilder } from 'typeorm';

import { NotificationEntity } from '../data';
import { User } from '../users/user';

export class NotificationsQueryBuilder {
  private query: SelectQueryBuilder<NotificationEntity>;
  private showDismissed: boolean;

  constructor(notifications: Repository<NotificationEntity>) {
    this.query = notifications
      .createQueryBuilder('notifications')
      .orderBy('notifications.active', 'DESC');
    this.showDismissed = false;
  }

  build(): SelectQueryBuilder<NotificationEntity> {
    return this.showDismissed
      ? this.query
      : this.query.andWhere('notifications.dismissed = false');
  }

  withDismissed(showDismissed?: boolean): this {
    this.showDismissed = showDismissed ?? false;
    return this;
  }

  withNewerThan(newerThan?: Date): this {
    if (newerThan) {
      this.query.andWhere('notifications.active >= :timestamp', {
        timestamp: newerThan,
      });
    }
    return this;
  }

  withPagination(skip?: number, limit?: number): this {
    this.query = this.query.offset(skip ?? 0).limit(limit ?? 50);
    return this;
  }

  withRecipient(recipient?: User): this {
    if (recipient) {
      this.query = this.query.andWhere(
        'notifications.recipient = :recipientId',
        {
          recipientId: recipient.id,
        },
      );
    }
    return this;
  }
}
