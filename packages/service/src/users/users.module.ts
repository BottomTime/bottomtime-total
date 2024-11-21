import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FriendshipEntity, UserEntity, UserJsonDataEntity } from '../data';
import { EventsModule } from '../events';
import { StorageModule } from '../storage';
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
    ]),
    EventsModule,
    StorageModule,
  ],
  providers: [UsersService, UserFactory, UserCustomDataService],
  controllers: [
    UsersController,
    UserController,
    UserCustomDataController,
    UserAvatarController,
  ],
  exports: [UsersService, UserFactory],
})
export class UsersModule {}
