import { NotificationsFeature } from '@bottomtime/common';

import { Injectable } from '@nestjs/common';

import { AssertFeature } from '../features';

@Injectable()
export class AssertNotificationsFeature extends AssertFeature {
  protected feature = NotificationsFeature;
}
