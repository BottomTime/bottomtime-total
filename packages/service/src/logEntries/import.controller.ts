import { Controller, UseGuards } from '@nestjs/common';

import { AssertImportFeature } from './assert-import-feature.guard';

@Controller('api/users/:username/logImports/:importId')
@UseGuards(AssertImportFeature)
export class ImportController {
  cancelImport() {}

  finalizeImport() {}

  importBatch() {}
}
