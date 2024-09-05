import { Module } from '@nestjs/common';

import { ConfigCatModule } from '../dependencies';
import { FeaturesService } from './features.service';

@Module({
  imports: [ConfigCatModule],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class FeaturesModule {}
