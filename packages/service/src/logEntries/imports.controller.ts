import { Controller, UseGuards } from '@nestjs/common';

import { AssertImportFeature } from './assert-import-feature.guard';

@Controller('api/users/:username/logbook/import')
@UseGuards(AssertImportFeature)
export class ImportsController {
  listImports() {}

  getImport() {}

  initImport() {}

  expireImports() {}
}
