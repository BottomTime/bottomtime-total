import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiveOperatorEntity } from '../data';
import { UsersModule } from '../users';
import { DiveOperatorsController } from './dive-operators.controller';
import { DiveOperatorsService } from './dive-operators.service';

@Module({
  imports: [TypeOrmModule.forFeature([DiveOperatorEntity]), UsersModule],
  providers: [DiveOperatorsService],
  controllers: [DiveOperatorsController],
})
export class DiveOperatorsModule {}
