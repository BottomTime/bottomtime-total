import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth';
import {
  FriendshipEntity,
  NotificationEntity,
  UserEntity,
  UserOAuthEntity,
} from '../data';
import { EmailModule } from '../email';
import { StorageModule } from '../storage';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { OAuthService } from './oauth.service';
import { UserAvatarController } from './user-avatar.controller';
import { UserController } from './user.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      FriendshipEntity,
      NotificationEntity,
      UserOAuthEntity,
    ]),
    EmailModule.forFeature(),
    StorageModule.forFeature(),
    AuthModule,
  ],
  providers: [UsersService, OAuthService, NotificationsService],
  controllers: [
    UsersController,
    UserController,
    NotificationsController,
    UserAvatarController,
  ],
  exports: [UsersService, OAuthService, NotificationsService],
})
export class UsersModule {}
