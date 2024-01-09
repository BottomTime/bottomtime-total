import { Module } from '@nestjs/common';
import { DiveSitesService } from './dive-sites.service';
import { DiveSitesController } from './dive-sites.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Collections } from '../schemas';
import { DiveSiteSchema } from '../schemas/dive-sites.document';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collections.DiveSites, schema: DiveSiteSchema },
    ]),
  ],

  providers: [DiveSitesService],
  controllers: [DiveSitesController],
})
export class DiveSitesModule {}
