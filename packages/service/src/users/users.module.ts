import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Queues } from '../common';
import { Config } from '../config';
import {
  FriendshipEntity,
  NotificationEntity,
  UserEntity,
  UserJsonDataEntity,
} from '../data';
import { QueueModule } from '../queue';
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
    StorageModule,
    QueueModule.forFeature({
      key: Queues.email,
      queueUrl: Config.aws.sqs.emailQueueUrl,
    }),
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
