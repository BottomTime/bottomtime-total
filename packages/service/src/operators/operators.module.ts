import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OperatorEntity, OperatorReviewEntity } from '../data';
import { StorageModule } from '../storage';
import { UsersModule } from '../users';
import { OperatorLogoController } from './operator-logo.controller';
import { OperatorReviewController } from './operator-review.controller';
import { OperatorReviewsController } from './operator-reviews.controller';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OperatorEntity, OperatorReviewEntity]),
    StorageModule,
    UsersModule,
  ],
  providers: [OperatorsService],
  controllers: [
    OperatorsController,
    OperatorLogoController,
    OperatorReviewsController,
    OperatorReviewController,
  ],
})
export class OperatorsModule {}
