import { Controller, UseGuards } from '@nestjs/common';

import { AssertImportFeature } from './assert-import-feature.guard';

@Controller('api/users/:username/logbook/import/:importId')
@UseGuards(AssertImportFeature)
export class ImportController {
  cancelImport() {}

  finalizeImport() {}

  importBatch() {}
}
