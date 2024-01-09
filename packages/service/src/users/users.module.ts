import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../schemas/user.document';
import { Collections } from '../schemas/collections';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collections.Users, schema: UserSchema },
    ]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
