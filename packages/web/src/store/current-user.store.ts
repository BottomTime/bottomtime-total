import {
  AccountTier,
  MembershipStatus,
  MembershipStatusDTO,
  UserDTO,
} from '@bottomtime/api';

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useCurrentUser = defineStore('currentUser', () => {
  const user = ref<UserDTO | null>(null);
  const membership = ref<MembershipStatusDTO>({
    accountTier: AccountTier.Basic,
    entitlements: [],
    status: MembershipStatus.None,
  });
  const anonymous = computed(() => user.value === null);

  const displayName = computed(
    () => user.value?.profile?.name || user.value?.username || '',
  );

  return { anonymous, displayName, membership, user };
});
