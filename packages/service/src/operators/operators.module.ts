import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  OperatorDiveSiteEntity,
  OperatorEntity,
  OperatorReviewEntity,
} from '../data';
import { DiveSitesModule } from '../diveSites';
import { EventsModule } from '../events';
import { StorageModule } from '../storage';
import { UsersModule } from '../users';
import { OperatorFactory } from './operator-factory';
import { OperatorLogoController } from './operator-logo.controller';
import { OperatorReviewController } from './operator-review.controller';
import { OperatorReviewsController } from './operator-reviews.controller';
import { OperatorSitesController } from './operator-sites.controller';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OperatorEntity,
      OperatorDiveSiteEntity,
      OperatorReviewEntity,
    ]),
    StorageModule,
    EventsModule,
    UsersModule,
    DiveSitesModule,
  ],
  providers: [OperatorsService, OperatorFactory],
  controllers: [
    OperatorsController,
    OperatorLogoController,
    OperatorReviewsController,
    OperatorReviewController,
    OperatorSitesController,
  ],
  exports: [OperatorsService, OperatorFactory],
})
export class OperatorsModule {}
