<template>
  <TabsPanel :tabs="Tabs" :active-tab="activeTab" @tab-changed="onTabChanged">
    <div class="overflow-y-auto">
      <ManageUserAccount
        v-if="activeTab === Tabs[0].key"
        :user="user"
        @account-lock-toggled="(id) => $emit('account-lock-toggled', id)"
        @password-reset="(id) => $emit('password-reset', id)"
        @role-changed="(id, role) => $emit('role-changed', id, role)"
        @username-changed="
          (id, username) => $emit('username-changed', id, username)
        "
        @email-changed="(id, email) => $emit('email-changed', id, email)"
      />

      <EditProfile
        v-else-if="activeTab === Tabs[1].key"
        ref="editProfileTab"
        :user="user"
        :responsive="false"
        @save-profile="(profile) => $emit('save-profile', user.id, profile)"
      />

      <EditSettings
        v-else-if="activeTab === Tabs[2].key"
        :user="user"
        @save-settings="(settings) => $emit('save-settings', user.id, settings)"
      />
    </div>
  </TabsPanel>
</template>

<script setup lang="ts">
import {
  ProfileDTO,
  UserDTO,
  UserRole,
  UserSettingsDTO,
} from '@bottomtime/api';

import { ref } from 'vue';

import { TabInfo } from '../../common';
import TabsPanel from '../common/tabs-panel.vue';
import EditProfile from '../users/edit-profile.vue';
import EditSettings from '../users/edit-settings.vue';
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
const editProfileTab = ref<InstanceType<typeof EditProfile> | null>(null);

defineProps<ManageUserProps>();
defineEmits<{
  (e: 'account-lock-toggled', userId: string): void;
  (e: 'password-reset', userId: string): void;
  (e: 'role-changed', userId: string, role: UserRole): void;
  (e: 'save-profile', userId: string, profile: ProfileDTO): void;
  (e: 'save-settings', userId: string, settings: UserSettingsDTO): void;
  (e: 'username-changed', userId: string, username: string): void;
  (e: 'email-changed', userId: string, email: string): void;
}>();

function onTabChanged(key: string) {
  activeTab.value = key;
}
</script>
