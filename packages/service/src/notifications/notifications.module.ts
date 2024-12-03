import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationEntity, NotificationWhitelistEntity } from '../data';
import { RedisModule } from '../dependencies';
import { FeaturesModule } from '../features';
import { UsersModule } from '../users';
import { NotificationEventsHandler } from './notification-events.handler';
import { NotificationPermissionsController } from './notification-permissions.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { UserNotificationsController } from './user-notifications.controller';

@Module({
  imports: [
    RedisModule,
    TypeOrmModule.forFeature([NotificationEntity, NotificationWhitelistEntity]),
    FeaturesModule,
    UsersModule,
  ],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationEventsHandler,
  ],
  controllers: [UserNotificationsController, NotificationPermissionsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
