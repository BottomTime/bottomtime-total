import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { CurrentUserDTO } from '@bottomtime/api';

export const useCurrentUser = defineStore('current-user', () => {
  const currentUser = ref<CurrentUserDTO>({ anonymous: true });
  const displayName = computed(() => {
    return currentUser.value.anonymous === false
      ? currentUser.value.profile?.name ?? `@${currentUser.value.username}`
      : '';
  });
  return { currentUser, displayName };
});
