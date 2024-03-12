import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiveSiteEntity } from '../data';
import { DiveSiteModelName, DiveSiteSchema } from '../schemas';
import { UsersModule } from '../users';
import { DiveSitesController } from './dive-sites.controller';
import { DiveSitesService } from './dive-sites.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiveSiteModelName, schema: DiveSiteSchema },
    ]),
    TypeOrmModule.forFeature([DiveSiteEntity]),
    UsersModule,
  ],

  providers: [DiveSitesService],
  controllers: [DiveSitesController],
  exports: [DiveSitesService],
})
export class DiveSitesModule {}
