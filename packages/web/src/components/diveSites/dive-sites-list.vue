<template>
  <!-- Dive sites list -->
  <div class="mx-2 mt-3 space-y-2">
    <!-- Dive site entries -->
    <div v-if="showMap" class="w-full">
      <div class="mx-auto w-auto md:w-[640px] aspect-video">
        <GoogleMap :sites="sites.data" @site-selected="onMapClicked" />
      </div>
    </div>

    <TransitionList class="px-2" data-testid="sites-list-content">
      <li
        v-if="sites.data.length === 0"
        key="No Sites"
        class="text-center text-lg m-6"
        data-testid="no-results"
      >
        <span class="mr-2">
          <i class="fas fa-exclamation-circle"></i>
        </span>
        <span class="italic">
          No sites were found matching your search criteria.
        </span>
      </li>

      <DiveSitesListItem
        v-for="site in sites.data"
        :key="site.id"
        :site="site"
        @site-selected="$emit('site-selected', site)"
        @toggle-selection="onToggleSiteSelected"
      />

      <li v-if="canLoadMore" key="Load More" class="text-center text-lg my-8">
        <LoadingSpinner
          v-if="isLoadingMore"
          data-testid="loading-more"
          message="Loading more sites..."
        />
        <a
          v-else
          class="space-x-1"
          test-id="load-more"
          @click="$emit('load-more')"
        >
          <span>
            <i class="fa-solid fa-arrow-down"></i>
          </span>
          <span>Load more</span>
        </a>
      </li>
    </TransitionList>
  </div>
</template>

<script lang="ts" setup>
import { ApiList, DiveSiteDTO } from '@bottomtime/api';

import { computed } from 'vue';

import { Selectable } from '../../common';
import GoogleMap from '../common/google-map.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import TransitionList from '../common/transition-list.vue';
import DiveSitesListItem from './dive-sites-list-item.vue';

type DiveSitesListProps = {
  sites: ApiList<Selectable<DiveSiteDTO>>;
  isLoadingMore?: boolean;
  multiSelect?: boolean;
  showMap?: boolean;
};

const props = withDefaults(defineProps<DiveSitesListProps>(), {
  isLoadingMore: false,
  multiSelect: false,
  showMap: true,
});
const emit = defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
  (e: 'load-more'): void;
}>();

const canLoadMore = computed(
  () => props.sites.data.length < props.sites.totalCount,
);

function onMapClicked(site: DiveSiteDTO) {
  emit('site-selected', site);
}

function onToggleSiteSelected(site: Selectable<DiveSiteDTO>) {
  site.selected = !site.selected;
}
</script>
