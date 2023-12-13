import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FriendModel,
  FriendSchema,
  FriendRequestModel,
  FriendRequestSchema,
  UserModel,
  UserSchema,
} from '../schemas';
import { FriendRequestsController } from './friend-requests.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FriendModel.name, schema: FriendSchema },
      { name: FriendRequestModel.name, schema: FriendRequestSchema },
      { name: UserModel.name, schema: UserSchema },
    ]),
  ],
  providers: [FriendsService],
  controllers: [FriendsController, FriendRequestsController],
  exports: [FriendsService],
})
export class FriendsModule {}
