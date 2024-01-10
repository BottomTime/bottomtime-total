import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModelName, UserSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserModelName, schema: UserSchema }]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
