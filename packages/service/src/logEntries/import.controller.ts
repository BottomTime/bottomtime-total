import { Controller, UseGuards } from '@nestjs/common';

import { ImportFeatureGuard } from './import-feature.guard';

@Controller('api/users/:username/logbook/import/:importId')
@UseGuards(ImportFeatureGuard)
export class ImportController {
  cancelImport() {}

  finalizeImport() {}

  importBatch() {}
}
