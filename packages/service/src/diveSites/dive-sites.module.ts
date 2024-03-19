import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiveSiteEntity, DiveSiteReviewEntity, UserEntity } from '../data';
import { UsersModule } from '../users';
import { DiveSitesController } from './dive-sites.controller';
import { DiveSitesService } from './dive-sites.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      DiveSiteEntity,
      DiveSiteReviewEntity,
    ]),
    UsersModule,
  ],
  providers: [DiveSitesService],
  controllers: [DiveSitesController],
  exports: [DiveSitesService],
})
export class DiveSitesModule {}
