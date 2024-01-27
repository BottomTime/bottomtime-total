import { UserDTO } from '@bottomtime/api';
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

export const useCurrentUser = defineStore('current-user', () => {
  const user = ref<UserDTO | null>(null);
  const anonymous = computed(() => user.value === null);

  const displayName = computed(() => {
    return user.value ? user.value.profile?.name ?? user.value.username : '';
  });

  return { anonymous, user, displayName };
});
