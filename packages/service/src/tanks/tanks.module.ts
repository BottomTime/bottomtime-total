import { Module } from '@nestjs/common';
import { TanksService } from './tanks.service';
import { TanksController } from './tanks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TankSchema } from '../schemas';
import { Collections } from '../data';
import { AssertTankOwner } from './assert-tank-owner.guard';
import { UserTanksController } from './user-tanks.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collections.Tanks, schema: TankSchema },
    ]),
  ],
  providers: [TanksService, AssertTankOwner],
  controllers: [TanksController, UserTanksController],
})
export class TanksModule {}
