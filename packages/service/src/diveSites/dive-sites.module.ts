import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DiveSiteModelName, DiveSiteSchema } from '../schemas';
import { UsersModule } from '../users';
import { DiveSitesController } from './dive-sites.controller';
import { DiveSitesService } from './dive-sites.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiveSiteModelName, schema: DiveSiteSchema },
    ]),
    UsersModule,
  ],

  providers: [DiveSitesService],
  controllers: [DiveSitesController],
  exports: [DiveSitesService],
})
export class DiveSitesModule {}
