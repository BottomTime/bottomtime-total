import { LogImportFeature } from '@bottomtime/common';

import { Injectable } from '@nestjs/common';

import { AssertFeature } from '../../features';

@Injectable()
export class AssertImportFeature extends AssertFeature {
  protected feature = LogImportFeature;
}
