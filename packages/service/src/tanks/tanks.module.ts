import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TankEntity, UserEntity } from '../data';
import { UsersModule } from '../users';
import { AssertTank } from './assert-tank.guard';
import { TanksService } from './tanks.service';
import { UserTanksController } from './user-tanks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TankEntity, UserEntity]), UsersModule],
  providers: [TanksService, AssertTank],
  controllers: [UserTanksController],
  exports: [TanksService],
})
export class TanksModule {}
