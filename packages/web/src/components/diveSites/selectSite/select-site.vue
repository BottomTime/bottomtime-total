<template>
  <TabsPanel
    :tabs="tabs"
    :active-tab="state.activeTab"
    @tab-changed="onTabChanged"
  >
    <RecentSitesList
      v-if="state.activeTab === SelectSiteTabs.Recent"
      :current-site="currentSite"
      @site-selected="(site) => $emit('site-selected', site)"
      @search="state.activeTab = SelectSiteTabs.Search"
    />

    <SearchDiveSitesForm
      v-else-if="state.activeTab === SelectSiteTabs.Search"
      @create="state.activeTab = SelectSiteTabs.Create"
      @site-selected="(site) => $emit('site-selected', site)"
    />

    <CreateSiteWizard
      v-else-if="state.activeTab === SelectSiteTabs.Create"
      :is-saving="state.isSavingNewSite"
      @save="onSaveNewSite"
    />
  </TabsPanel>
</template>

<script lang="ts" setup>
import { CreateOrUpdateDiveSiteDTO, DiveSiteDTO } from '@bottomtime/api';

import { computed, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { TabInfo, ToastType } from '../../../common';
import { useOops } from '../../../oops';
import { useToasts } from '../../../store';
import TabsPanel from '../../common/tabs-panel.vue';
import CreateSiteWizard from '../create-site-wizard.vue';
import RecentSitesList from './recent-sites-list.vue';
import SearchDiveSitesForm from './search-dive-sites-form.vue';

enum SelectSiteTabs {
  Recent = 'recent',
  Search = 'search',
  Create = 'create',
}

interface SelectSiteState {
  activeTab: SelectSiteTabs;
  isSavingNewSite: boolean;
}

interface SelectSiteProps {
  currentSite?: DiveSiteDTO;
}

const client = useClient();
const oops = useOops();
const toasts = useToasts();

defineProps<SelectSiteProps>();
const emit = defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
}>();

const tabs = computed<TabInfo[]>(() => [
  { key: SelectSiteTabs.Recent, label: 'Recent Sites' },
  { key: SelectSiteTabs.Search, label: 'Search for a Site' },
  { key: SelectSiteTabs.Create, label: 'Create a New Site' },
]);

const state = reactive<SelectSiteState>({
  activeTab: SelectSiteTabs.Recent,
  isSavingNewSite: false,
});

function onTabChanged(key: string) {
  state.activeTab = key as SelectSiteTabs;
}

async function onSaveNewSite(dto: CreateOrUpdateDiveSiteDTO): Promise<void> {
  state.isSavingNewSite = true;

  await oops(async () => {
    const site = await client.diveSites.createDiveSite(dto);
    emit('site-selected', site.toJSON());

    toasts.toast({
      id: 'dive-site-created',
      message: 'Dive site created successfully',
      type: ToastType.Success,
    });
  });

  state.isSavingNewSite = false;
}
</script>
