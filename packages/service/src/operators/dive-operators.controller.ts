import { Controller, Inject } from '@nestjs/common';

import { DiveOperatorsService } from './dive-operators.service';

@Controller('api/operators')
export class DiveOperatorsController {
  constructor(
    @Inject(DiveOperatorsService)
    private readonly service: DiveOperatorsService,
  ) {}
}
