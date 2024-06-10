import { AdminSearchUsersResponseDTO, UserDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useAdmin = defineStore('admin', () => {
  const currentUser = ref<UserDTO | null>(null);

  const users = reactive<AdminSearchUsersResponseDTO>({
    users: [],
    totalCount: 0,
  });

  return { currentUser, users };
});
