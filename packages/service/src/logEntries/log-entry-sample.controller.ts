import { Controller, Delete, Get, Post } from '@nestjs/common';

@Controller('api/users/:username/logbook/:entryId/samples')
export class LogEntrySampleController {
  @Get()
  getSamples() {}

  @Post()
  addSampleData() {}

  @Delete()
  clearSamples() {}
}
