import { Controller, UseGuards } from '@nestjs/common';

import { ImportFeatureGuard } from './import-feature.guard';

@Controller('api/users/:username/logbook/import')
@UseGuards(ImportFeatureGuard)
export class ImportsController {
  listImports() {}

  getImport() {}

  initImport() {}

  expireImports() {}
}
