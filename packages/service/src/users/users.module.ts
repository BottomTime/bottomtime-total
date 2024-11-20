import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  FriendshipEntity,
  NotificationEntity,
  UserEntity,
  UserJsonDataEntity,
} from '../data';
import { EventsModule } from '../events';
import { StorageModule } from '../storage';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsGateway } from './notifications/notifications.gateway';
import { NotificationsService } from './notifications/notifications.service';
import { UserAvatarController } from './user-avatar.controller';
import { UserCustomDataController } from './user-custom-data.controller';
import { UserCustomDataService } from './user-custom-data.service';
import { UserFactory } from './user-factory';
import { UserController } from './user.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserJsonDataEntity,
      FriendshipEntity,
      NotificationEntity,
    ]),
    EventsModule,
    StorageModule,
  ],
  providers: [
    UsersService,
    UserFactory,
    NotificationsService,
    NotificationsGateway,
    UserCustomDataService,
  ],
  controllers: [
    UsersController,
    UserController,
    UserCustomDataController,
    NotificationsController,
    UserAvatarController,
  ],
  exports: [UsersService, UserFactory, NotificationsService],
})
export class UsersModule {}
