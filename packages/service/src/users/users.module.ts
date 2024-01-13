import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FriendModelName,
  FriendSchema,
  UserModelName,
  UserSchema,
} from '../schemas';
import { AuthModule } from '../auth';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModelName, schema: UserSchema },
      { name: FriendModelName, schema: FriendSchema },
    ]),
    AuthModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
