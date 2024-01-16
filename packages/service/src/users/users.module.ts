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
import { EmailModule } from '../email';
import { UserController } from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModelName, schema: UserSchema },
      { name: FriendModelName, schema: FriendSchema },
    ]),
    AuthModule,
    EmailModule.forFeature(),
  ],
  providers: [UsersService],
  controllers: [UsersController, UserController],
  exports: [UsersService],
})
export class UsersModule {}
