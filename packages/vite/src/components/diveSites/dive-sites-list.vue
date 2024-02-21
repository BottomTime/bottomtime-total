<template>
  <!-- Loading spinner -->
  <div
    v-if="state.isLoading"
    class="text-center text-lg"
    data-testid="loading-dive=sites"
  >
    <span class="mr-3">
      <i class="fas fa-spinner fa-spin"></i>
    </span>
    <span class="italic">Loading...</span>
  </div>

  <!-- Dive sites list -->
  <div v-else>
    <!-- Dive site count and sort order -->
    <FormBox class="flex flex-row gap-2 sticky top-16">
      <span class="font-bold">Showing Dive Sites:</span>
      <span>{{ data.sites.length }}</span>
      <span>of</span>
      <span class="grow">{{ data.totalCount }}</span>
    </FormBox>

    <!-- Dive site entries -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      <DiveSitesListItem
        v-for="site in data.sites"
        :key="site.id"
        :site="site"
        @site-selected="onSiteSelected"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  DiveSiteDTO,
  DiveSitesSortBy,
  SearchDiveSitesResponseDTO,
  SortOrder,
} from '@bottomtime/api';

import { onBeforeMount, reactive, ref } from 'vue';

import { useClient } from '../../client';
import { useOops } from '../../oops';
import FormBox from '../common/form-box.vue';
import DiveSitesListItem from './dive-sites-list-item.vue';

type DiveSitesListState = {
  isLoading: boolean;
};

const client = useClient();
const oops = useOops();

const state = reactive<DiveSitesListState>({
  isLoading: false,
});
const data = ref<SearchDiveSitesResponseDTO>({
  sites: [],
  totalCount: 0,
});
const selectedSite = ref<DiveSiteDTO | null>(null);

async function refreshDiveSites() {
  state.isLoading = true;

  await oops(async () => {
    const results = await client.diveSites.searchDiveSites({
      sortBy: DiveSitesSortBy.Name,
      sortOrder: SortOrder.Ascending,
    });
    data.value = {
      sites: results.sites.map((site) => site.toJSON()),
      totalCount: results.totalCount,
    };
  });

  state.isLoading = false;
}

onBeforeMount(async () => {
  await refreshDiveSites();
});

function onSiteSelected(site: DiveSiteDTO) {
  selectedSite.value = site;
}
</script>
