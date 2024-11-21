import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationEntity, NotificationWhitelistEntity } from '../data';
import { FeaturesModule } from '../features';
import { UsersModule } from '../users';
import { NotificationEventsHandler } from './notification-events.handler';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { UserNotificationsController } from './user-notifications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, NotificationWhitelistEntity]),
    FeaturesModule,
    UsersModule,
  ],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationEventsHandler,
  ],
  controllers: [UserNotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
