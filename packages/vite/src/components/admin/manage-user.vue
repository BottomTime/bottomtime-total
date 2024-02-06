<template>
  <TabPanel
    :tabs="Tabs"
    :active-tab="activeTab"
    @tab-changing="onTabChanging"
    @tab-changed="onTabChanged"
  >
    <ManageUserAccount
      v-if="activeTab === Tabs[0].key"
      :user="user"
      @account-lock-toggled="(id) => $emit('account-lock-toggled', id)"
      @password-reset="(id) => $emit('password-reset', id)"
      @role-changed="(id, role) => $emit('role-changed', id, role)"
    />
    <EditProfile
      v-else-if="activeTab === Tabs[1].key"
      :profile="user.profile"
    />
    <p v-else>Hihi!</p>
  </TabPanel>
</template>

<script setup lang="ts">
import { UserDTO, UserRole } from '@bottomtime/api';

import { ref } from 'vue';

import { TabInfo } from '../../common';
import TabPanel from '../common/tabs-panel.vue';
import EditProfile from '../users/edit-profile.vue';
import ManageUserAccount from './manage-user-account.vue';

type ManageUserProps = {
  user: UserDTO;
};

const Tabs: TabInfo[] = [
  { key: 'manage', label: 'Manage Account' },
  { key: 'profile', label: 'Profile' },
  { key: 'settings', label: 'Settings' },
];
const activeTab = ref(Tabs[0].key);

defineProps<ManageUserProps>();
defineEmits<{
  (e: 'account-lock-toggled', userId: string): void;
  (e: 'password-reset', userId: string): void;
  (e: 'role-changed', userId: string, role: UserRole): void;
}>();

function onTabChanging(key: string, cancel: () => void) {
  // TODO: Check for unsaved changes and cancel if necessary.
}

function onTabChanged(key: string) {
  activeTab.value = key;
}
</script>
