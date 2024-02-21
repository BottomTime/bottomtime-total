<template>
  <!-- Loading spinner -->
  <div
    v-if="isLoading"
    class="text-center text-lg m-6"
    data-testid="loading-dive=sites"
  >
    <span class="mr-2">
      <i class="fas fa-spinner fa-spin"></i>
    </span>
    <span class="italic">Loading...</span>
  </div>

  <div v-else-if="data.sites.length === 0" class="text-center text-lg m-6">
    <span class="mr-2">
      <i class="fas fa-exclamation-circle"></i>
    </span>
    <span class="italic">
      No sites were found matching your search criteria.
    </span>
  </div>

  <!-- Dive sites list -->
  <div v-else>
    <!-- Dive site entries -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
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
import { DiveSiteDTO, SearchDiveSitesResponseDTO } from '@bottomtime/api';

import { ref, watch } from 'vue';

import DiveSitesListItem from './dive-sites-list-item.vue';

type DiveSitesListProps = {
  data: SearchDiveSitesResponseDTO;
  isLoading?: boolean;
};

const props = withDefaults(defineProps<DiveSitesListProps>(), {
  isLoading: false,
});
const selectedSite = ref<DiveSiteDTO | null>(null);

watch(props.data, () => {
  selectedSite.value = null;
});

function onSiteSelected(site: DiveSiteDTO) {
  selectedSite.value = site;
}
</script>
