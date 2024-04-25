<template>
  <DrawerPanel
    :visible="visible"
    :title="profile ? profile.name || `@${profile.username}` : 'Profile'"
    :full-screen="profile ? `/profile/${profile.username}` : undefined"
    @close="$emit('close')"
  >
    <ViewProfile v-if="profile" :profile="profile" />

    <div
      v-else-if="profile === null"
      class="my-12 text-center text-xl italic space-x-3"
      data-testid="profile-not-found"
    >
      <span>
        <i class="fa-regular fa-user"></i>
      </span>
      <span>
        Oops! We can't seem to find this user's profile info at the moment.
      </span>
    </div>

    <div
      v-else
      class="my-12 text-center text-xl italic space-x-3"
      data-testid="loading-profile"
    >
      <span>
        <i class="fa-solid fa-spinner fa-spin"></i>
      </span>
      <span>Loading profile info...</span>
    </div>
  </DrawerPanel>
</template>

<script lang="ts" setup>
import { ProfileDTO } from '@bottomtime/api';

import DrawerPanel from '../common/drawer-panel.vue';
import ViewProfile from './view-profile.vue';

interface ProfilePanelProps {
  isLoading?: boolean;
  profile?: ProfileDTO | null;
  visible?: boolean;
}

withDefaults(defineProps<ProfilePanelProps>(), {
  isLoading: false,
  visible: false,
});
defineEmits<{
  (e: 'close'): void;
}>();
</script>
