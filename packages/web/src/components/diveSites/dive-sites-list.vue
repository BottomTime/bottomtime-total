<template>
  <div
    v-if="sites.data.length === 0"
    class="text-center text-lg m-6"
    data-testid="no-results"
  >
    <span class="mr-2">
      <i class="fas fa-exclamation-circle"></i>
    </span>
    <span class="italic">
      No sites were found matching your search criteria.
    </span>
  </div>

  <!-- Dive sites list -->
  <div v-else class="mx-2 mt-3 space-y-2">
    <!-- Dive site entries -->
    <div v-if="showMap" class="flex justify-center w-full">
      <div class="w-full lg:w-[600px]">
        <GoogleMap :sites="sites.data" @site-selected="onMapClicked" />
      </div>
    </div>

    <TransitionList class="px-2" data-testid="sites-list-content">
      <DiveSitesListItem
        v-for="site in sites.data"
        :key="site.id"
        :site="site"
        @site-selected="$emit('site-selected', site)"
        @toggle-selection="onToggleSiteSelected"
      />
    </TransitionList>

    <div v-if="canLoadMore" class="text-center font-bold text-lg">
      <p v-if="isLoadingMore" data-testid="loading-more" class="p-2">
        <span>
          <i class="fas fa-spinner fa-spin"></i>
        </span>
        <span> Loading...</span>
      </p>
      <FormButton
        v-else
        type="link"
        size="lg"
        test-id="load-more"
        @click="$emit('load-more')"
      >
        Load more...
      </FormButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ApiList, DiveSiteDTO } from '@bottomtime/api';

import { computed } from 'vue';

import { Selectable } from '../../common';
import FormButton from '../common/form-button.vue';
import GoogleMap from '../common/google-map.vue';
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
