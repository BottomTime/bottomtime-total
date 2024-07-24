import { Controller, Inject } from '@nestjs/common';

import { FeaturesService } from './features.service';

@Controller('api/features')
export class FeaturesController {
  constructor(
    @Inject(FeaturesService)
    private readonly service: FeaturesService,
  ) {}
}
