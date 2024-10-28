import { AccountTier, UserDTO } from '@bottomtime/api';

import { EventKey } from '../event-key';

export type MembershipCancelledEvent = {
  type: EventKey.MembershipCanceled;
  user: UserDTO;
  previousTier: AccountTier;
  previousTierName: string;
};
