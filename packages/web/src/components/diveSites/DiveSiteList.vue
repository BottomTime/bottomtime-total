<template>
  <!-- Loading spinner if we're waiting on a server response... -->
  <article v-if="isLoading" class="media">
    <div class="media-content">
      <div class="content has-text-centered">
        <LoadingSpinner message="Fetching dive sites..." />
      </div>
    </div>
  </article>

  <!-- List dive sites ... -->
  <div v-else-if="sites.length">
    <DiveSiteItem v-for="site in sites" :key="site.id" :site="site" />
  </div>

  <!-- ...or a helpful message if there are none to show. -->
  <article v-else class="media">
    <div class="media-content">
      <div class="content">
        <p class="has-text-centered">
          <em>No dive sites were found matching your search parameters.</em>
        </p>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { DiveSite } from '@/diveSites';
import DiveSiteItem from '@/components/diveSites/DiveSiteItem.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

interface DiveSiteListProps {
  isLoading: boolean;
  sites: DiveSite[];
}

defineProps<DiveSiteListProps>();
</script>
