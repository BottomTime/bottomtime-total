import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OperatorEntity, OperatorReviewEntity } from '../data';
import { EventsModule } from '../events';
import { StorageModule } from '../storage';
import { UsersModule } from '../users';
import { OperatorFactory } from './operator-factory';
import { OperatorLogoController } from './operator-logo.controller';
import { OperatorReviewController } from './operator-review.controller';
import { OperatorReviewsController } from './operator-reviews.controller';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OperatorEntity, OperatorReviewEntity]),
    StorageModule,
    EventsModule,
    UsersModule,
  ],
  providers: [OperatorsService, OperatorFactory],
  controllers: [
    OperatorsController,
    OperatorLogoController,
    OperatorReviewsController,
    OperatorReviewController,
  ],
  exports: [OperatorsService, OperatorFactory],
})
export class OperatorsModule {}
