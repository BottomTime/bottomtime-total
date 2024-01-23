import { ref } from 'vue';
import { defineStore } from 'pinia';
import { CurrentUserDTO } from '@bottomtime/api';

export const useCurrentUserStore = defineStore('current-user', () => {
  const currentUser = ref<CurrentUserDTO>({ anonymous: true });
  return { currentUser };
});
