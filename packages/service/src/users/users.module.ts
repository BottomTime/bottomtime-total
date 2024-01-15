import { Module } from '@nestjs/common';
import { UsersAccountController } from './users-account.controller';
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
  controllers: [UsersAccountController],
  exports: [UsersService],
})
export class UsersModule {}
