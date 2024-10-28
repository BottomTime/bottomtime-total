import { AccountTier, UserDTO } from '@bottomtime/api';

import { EventKey } from '../event-key';

export type MembershipChangedEvent = {
  type: EventKey.MembershipChanged;
  user: UserDTO;
  newTier: AccountTier;
  newTierName: string;
  previousTier: AccountTier;
  previousTierName: string;
};
