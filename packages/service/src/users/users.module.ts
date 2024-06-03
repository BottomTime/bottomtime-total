import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth';
import {
  FriendshipEntity,
  NotificationEntity,
  UserEntity,
  UserJsonDataEntity,
} from '../data';
import { EmailModule } from '../email';
import { StorageModule } from '../storage';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UserAvatarController } from './user-avatar.controller';
import { UserCustomDataController } from './user-custom-data.controller';
import { UserCustomDataService } from './user-custom-data.service';
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
    EmailModule.forFeature(),
    StorageModule.forFeature(),
    AuthModule,
  ],
  providers: [UsersService, NotificationsService, UserCustomDataService],
  controllers: [
    UsersController,
    UserController,
    UserCustomDataController,
    NotificationsController,
    UserAvatarController,
  ],
  exports: [UsersService, NotificationsService],
})
export class UsersModule {}
