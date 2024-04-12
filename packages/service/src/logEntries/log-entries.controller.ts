import { Controller, Inject } from '@nestjs/common';

import { LogEntriesService } from './log-entries.service';

@Controller('api/diveLogs')
export class LogEntriesController {
  constructor(
    @Inject(LogEntriesService) private readonly service: LogEntriesService,
  ) {}
}
