<template>
  <div
    v-if="data.sites.length === 0"
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
  <div v-else class="mx-2">
    <!-- Dive site entries -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
      <DiveSitesListItem
        v-for="site in data.sites"
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
import { DiveSiteDTO, SearchDiveSitesResponseDTO } from '@bottomtime/api';

import { computed } from 'vue';

import FormButton from '../common/form-button.vue';
import DiveSitesListItem from './dive-sites-list-item.vue';

type DiveSitesListProps = {
  data: SearchDiveSitesResponseDTO;
  isLoadingMore?: boolean;
};

const props = withDefaults(defineProps<DiveSitesListProps>(), {
  isLoadingMore: false,
});
defineEmits<{
  (e: 'site-selected', site: DiveSiteDTO): void;
  (e: 'load-more'): void;
}>();

const canLoadMore = computed(
  () => props.data.sites.length < props.data.totalCount,
);
</script>
