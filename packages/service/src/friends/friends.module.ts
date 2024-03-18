import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FriendRequestEntity, FriendshipEntity, UserEntity } from '../data';
import { UsersModule } from '../users';
import { AssertFriendshipOwner } from './assert-friendship-owner.guard';
import { FriendRequestsController } from './friend-requests.controller';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
  imports: [
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
