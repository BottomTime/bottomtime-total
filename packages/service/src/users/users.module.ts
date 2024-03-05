import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth';
import { FriendshipEntity, UserEntity } from '../data';
import { EmailModule } from '../email';
import {
  FriendModelName,
  FriendSchema,
  UserModelName,
  UserSchema,
} from '../schemas';
import { UserController } from './user.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModelName, schema: UserSchema },
      { name: FriendModelName, schema: FriendSchema },
    ]),
    TypeOrmModule.forFeature([UserEntity, FriendshipEntity]),
    EmailModule.forFeature(),
    AuthModule,
  ],
  providers: [UsersService],
  controllers: [UsersController, UserController],
  exports: [UsersService],
})
export class UsersModule {}
