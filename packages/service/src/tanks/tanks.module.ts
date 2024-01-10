import { Module } from '@nestjs/common';
import { TanksService } from './tanks.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TankModelName, TankSchema } from '../schemas';
import { AssertTank } from './assert-tank';
import { UserTanksController } from './user-tanks.controller';
import { UsersModule } from '../users';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TankModelName, schema: TankSchema }]),
    UsersModule,
  ],
  providers: [TanksService, AssertTank],
  controllers: [UserTanksController],
  exports: [TanksService],
})
export class TanksModule {}
