import { Controller, Get } from '@nestjs/common';

@Controller('api/users/:username/logbook/:entryId/samples')
export class LogEntrySampleController {
  @Get()
  getSamples() {}

  addSampleData() {}

  clearSamples() {}
}
