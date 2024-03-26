import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth';
import { FriendshipEntity, NotificationEntity, UserEntity } from '../data';
import { EmailModule } from '../email';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UserController } from './user.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      FriendshipEntity,
      NotificationEntity,
    ]),
    EmailModule.forFeature(),
    AuthModule,
  ],
  providers: [UsersService, NotificationsService],
  controllers: [UsersController, UserController, NotificationsController],
  exports: [UsersService, NotificationsService],
})
export class UsersModule {}
