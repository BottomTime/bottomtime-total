import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth';
import { FriendshipEntity, UserEntity } from '../data';
import { EmailModule } from '../email';
import { UserController } from './user.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, FriendshipEntity]),
    EmailModule.forFeature(),
    AuthModule,
  ],
  providers: [UsersService],
  controllers: [UsersController, UserController],
  exports: [UsersService],
})
export class UsersModule {}
