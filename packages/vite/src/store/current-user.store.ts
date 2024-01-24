import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { User } from '../client/user';

export const useCurrentUser = defineStore('current-user', () => {
  const user = ref<User | null>(null);
  const anonymous = computed(() => user.value === null);

  const displayName = computed(() => {
    return user.value
      ? user.value.profile?.name ?? `@${user.value.username}`
      : '';
  });

  return { anonymous, user, displayName };
});
