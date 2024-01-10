import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FriendSchema,
  FriendRequestSchema,
  UserSchema,
  UserModelName,
  FriendModelName,
  FriendRequestModelName,
} from '../schemas';
import { FriendRequestsController } from './friend-requests.controller';
import { UsersModule } from '../users';
import { AssertFriendshipOwner } from './assert-friendship-owner.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModelName, schema: UserSchema },
      { name: FriendModelName, schema: FriendSchema },
      { name: FriendRequestModelName, schema: FriendRequestSchema },
    ]),

    UsersModule,
  ],
  providers: [FriendsService, AssertFriendshipOwner],
  controllers: [FriendsController, FriendRequestsController],
  exports: [FriendsService],
})
export class FriendsModule {}
