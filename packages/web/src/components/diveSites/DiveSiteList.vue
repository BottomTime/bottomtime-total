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
  <div v-else-if="sites.length" class="tile is-ancestor is-vertical">
    <div role="list" class="tile is-parent is-vertical">
      <DiveSiteItem v-for="site in sites" :key="site.id" :site="site" />
    </div>

    <div class="tile is-parent">
      <div class="tile is-child has-text-centered">
        <button class="button">Load More</button>
      </div>
    </div>
  </div>

  <!-- ...or a helpful message if there are none to show. -->
  <article v-else class="media" role="alert">
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
import { DiveSite } from '@/client/diveSites';
import DiveSiteItem from '@/components/diveSites/DiveSiteItem.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

interface DiveSiteListProps {
  isLoading: boolean;
  sites: DiveSite[];
}

defineProps<DiveSiteListProps>();
</script>
