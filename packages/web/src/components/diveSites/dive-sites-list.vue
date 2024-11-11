<template>
  <div
    v-if="data.data.length === 0"
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
  <div v-else class="mx-2 mt-3">
    <!-- Dive site entries -->
    <div class="flex justify-center w-full">
      <div class="w-full lg:w-[600px]">
        <GoogleMap :sites="data.data" @site-selected="onMapClicked" />
      </div>
    </div>

    <div
      class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-3"
      data-testid="sites-list-content"
    >
      <DiveSitesListItem
        v-for="site in data.data"
        :key="site.id"
        :site="site"
        @site-selected="$emit('site-selected', site)"
      />
    </div>

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

import FormButton from '../common/form-button.vue';
import GoogleMap from '../common/google-map.vue';
import DiveSitesListItem from './dive-sites-list-item.vue';

type DiveSitesListProps = {
  data: ApiList<DiveSiteDTO>;
  isLoadingMore?: boolean;
};

const props = withDefaults(defineProps<DiveSitesListProps>(), {
  isLoadingMore: false,
});
const emit = defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
  (e: 'load-more'): void;
}>();

const canLoadMore = computed(
  () => props.data.data.length < props.data.totalCount,
);

function onMapClicked(site: DiveSiteDTO) {
  emit('site-selected', site);
}
</script>
