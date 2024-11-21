import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationEntity } from '../data';
import { FeaturesModule } from '../features';
import { UsersModule } from '../users';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { UserNotificationsController } from './user-notifications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    FeaturesModule,
    UsersModule,
  ],
  providers: [NotificationsService, NotificationsGateway],
  controllers: [UserNotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
