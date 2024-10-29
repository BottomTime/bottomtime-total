import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OperatorEntity } from '../data';
import { StorageModule } from '../storage';
import { UsersModule } from '../users';
import { OperatorLogoController } from './operator-logo.controller';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OperatorEntity]),
    StorageModule,
    UsersModule,
  ],
  providers: [OperatorsService],
  controllers: [OperatorsController, OperatorLogoController],
})
export class OperatorsModule {}
