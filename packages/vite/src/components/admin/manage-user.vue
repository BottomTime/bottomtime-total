<template>
  <TabPanel
    :tabs="Tabs"
    :active-tab="activeTab"
    @tab-changing="onTabChanging"
    @tab-changed="onTabChanged"
  >
    <ManageUserAccount v-if="activeTab === Tabs[0].key" :user="user" />
    <p v-else>Hihi!</p>
  </TabPanel>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { User } from '../../client';
import { TabInfo } from '../../common';
import TabPanel from '../common/tabs-panel.vue';
import ManageUserAccount from './manage-user-account.vue';

type ManageUserProps = {
  user: User;
};

const Tabs: TabInfo[] = [
  { key: 'manage', label: 'Manage Account' },
  { key: 'profile', label: 'Profile' },
  { key: 'settings', label: 'Settings' },
];
const activeTab = ref(Tabs[0].key);

defineProps<ManageUserProps>();

function onTabChanging(key: string, cancel: () => void) {
  // TODO: Check for unsaved changes and cancel if necessary.
}

function onTabChanged(key: string) {
  activeTab.value = key;
}
</script>
