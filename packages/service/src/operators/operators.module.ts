import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OperatorEntity } from '../data';
import { UsersModule } from '../users';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';

@Module({
  imports: [TypeOrmModule.forFeature([OperatorEntity]), UsersModule],
  providers: [OperatorsService],
  controllers: [OperatorsController],
})
export class OperatorsModule {}
