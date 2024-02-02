import { UserDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useCurrentUser = defineStore('current-user', () => {
  const user = ref<UserDTO | null>(null);
  const anonymous = computed(() => user.value === null);

  const displayName = computed(
    () => user.value?.profile?.name || user.value?.username || '',
  );

  return { anonymous, user, displayName };
});
