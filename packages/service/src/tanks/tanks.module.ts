import { Module } from '@nestjs/common';
import { TanksService } from './tanks.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TankSchema } from '../schemas';
import { Collections } from '../schemas/collections';
import { AssertTank } from './assert-tank';
import { UserTanksController } from './user-tanks.controller';
import { UsersModule } from '../users';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collections.Tanks, schema: TankSchema },
    ]),
    UsersModule,
  ],
  providers: [TanksService, AssertTank],
  controllers: [UserTanksController],
  exports: [TanksService],
})
export class TanksModule {}
