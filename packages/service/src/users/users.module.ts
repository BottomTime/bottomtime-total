import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  FriendshipEntity,
  NotificationEntity,
  UserEntity,
  UserJsonDataEntity,
} from '../data';
import { StorageModule } from '../storage';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
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
    StorageModule.forFeature(),
  ],
  providers: [
    UsersService,
    UserFactory,
    NotificationsService,
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
