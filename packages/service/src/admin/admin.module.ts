import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminUsersController } from './admin-users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from '../schemas';
import { UsersModule } from '../users';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }]),
    UsersModule,
  ],
  providers: [AdminService],
  controllers: [AdminUsersController],
  exports: [],
})
export class AdminModule {}
