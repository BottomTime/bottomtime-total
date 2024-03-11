import {
  FriendRequestEntity,
  FriendshipEntity,
  PostgresDataSourceOptions,
  UserEntity,
} from '@/data';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  FriendModelName,
  FriendRequestModelName,
  FriendRequestSchema,
  FriendSchema,
  UserModelName,
  UserSchema,
} from '../schemas';
import { UsersModule } from '../users';
import { AssertFriendshipOwner } from './assert-friendship-owner.guard';
import { FriendRequestsController } from './friend-requests.controller';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModelName, schema: UserSchema },
      { name: FriendModelName, schema: FriendSchema },
      { name: FriendRequestModelName, schema: FriendRequestSchema },
    ]),
    TypeOrmModule.forFeature([
      UserEntity,
      FriendshipEntity,
      FriendRequestEntity,
    ]),

    UsersModule,
  ],
  providers: [FriendsService, AssertFriendshipOwner],
  controllers: [FriendsController, FriendRequestsController],
  exports: [FriendsService],
})
export class FriendsModule {}
