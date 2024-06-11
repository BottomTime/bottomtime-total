import { ProfileDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useProfiles = defineStore('profiles', () => {
  const currentProfile = ref<ProfileDTO | null>(null);

  return { currentProfile };
});
