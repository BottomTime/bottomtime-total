import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiveSiteEntity, DiveSiteReviewEntity, UserEntity } from '../data';
import { EventsModule } from '../events';
import { UsersModule } from '../users';
import { DiveSiteFactory } from './dive-site-factory';
import { DiveSiteReviewEventListener } from './dive-site-review.listener';
import { DiveSiteReviewsController } from './dive-site-reviews.controller';
import { DiveSitesController } from './dive-sites.controller';
import { DiveSitesService } from './dive-sites.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      DiveSiteEntity,
      DiveSiteReviewEntity,
    ]),
    EventsModule,
    UsersModule,
  ],
  providers: [
    DiveSitesService,
    DiveSiteReviewEventListener,
    DiveSiteFactory,
    DiveSiteReviewEventListener,
  ],
  controllers: [DiveSitesController, DiveSiteReviewsController],
  exports: [DiveSitesService, DiveSiteFactory],
})
export class DiveSitesModule {}
