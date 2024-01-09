import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendSchema, FriendRequestSchema, UserSchema } from '../schemas';
import { FriendRequestsController } from './friend-requests.controller';
import { UsersModule } from '../users';
import { Collections } from '../schemas/collections';
import { AssertFriendshipOwner } from './assert-friendship-owner.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collections.Users, schema: UserSchema },
      { name: Collections.Friends, schema: FriendSchema },
      { name: Collections.FriendRequests, schema: FriendRequestSchema },
    ]),

    UsersModule,
  ],
  providers: [FriendsService, AssertFriendshipOwner],
  controllers: [FriendsController, FriendRequestsController],
  exports: [FriendsService],
})
export class FriendsModule {}
