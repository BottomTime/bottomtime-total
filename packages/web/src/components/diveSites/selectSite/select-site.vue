<template>
  <TabsPanel
    :tabs="tabs"
    :active-tab="state.activeTab"
    @tab-changed="onTabChanged"
  >
    <KeepAlive>
      <RecentSitesList
        v-if="state.activeTab === SelectSiteTabs.Recent"
        :current-site="currentSite"
      />

      <SearchDiveSitesForm
        v-else-if="state.activeTab === SelectSiteTabs.Search"
        @site-selected="(site) => $emit('site-selected', site)"
      />

      <CreateSiteWizard v-else-if="state.activeTab === SelectSiteTabs.Create" />
    </KeepAlive>
  </TabsPanel>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import { computed, reactive } from 'vue';

import { TabInfo } from '../../../common';
import TabsPanel from '../../common/tabs-panel.vue';
import CreateSiteWizard from './create-site-wizard.vue';
import RecentSitesList from './recent-sites-list.vue';
import SearchDiveSitesForm from './search-dive-sites-form.vue';

enum SelectSiteTabs {
  Recent = 'recent',
  Search = 'search',
  Create = 'create',
}

interface SelectSiteState {
  activeTab: SelectSiteTabs;
}

interface SelectSiteProps {
  currentSite?: DiveSiteDTO;
}

defineProps<SelectSiteProps>();
defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
}>();

const tabs = computed<TabInfo[]>(() => [
  { key: SelectSiteTabs.Recent, label: 'Recent Sites' },
  { key: SelectSiteTabs.Search, label: 'Search for a Site' },
  { key: SelectSiteTabs.Create, label: 'Create a New Site' },
]);

const state = reactive<SelectSiteState>({
  activeTab: SelectSiteTabs.Recent,
});

function onTabChanged(key: string) {
  state.activeTab = key as SelectSiteTabs;
}
</script>
