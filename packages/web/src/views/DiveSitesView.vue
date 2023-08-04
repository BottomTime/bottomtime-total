<template>
  <PageTitle title="Dive Sites" />
  <section class="section">
    <div id="dive-sites-page" class="container">
      <div class="tile is-ancestor">
        <div class="tile is-parent is-vertical is-3">
          <div class="tile is-child box is-info">
            <DiveSiteFilters />
          </div>
        </div>
        <div class="tile is-parent is-vertical is-9">
          <div class="tile is-child">
            <SearchBar autofocus />
          </div>
          <div class="tile is-child">
            <DiveSiteList :isLoading="state.isLoading" :sites="state.sites" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue';

import DiveSiteFilters from '@/components/diveSites/DiveSiteFilters.vue';
import DiveSiteList from '@/components/diveSites/DiveSiteList.vue';
import { DiveSiteManagerKey, WithErrorHandlingKey } from '@/injection-keys';
import { inject } from '@/helpers';
import PageTitle from '@/components/PageTitle.vue';
import SearchBar from '@/components/forms/SearchBar.vue';
import { DiveSite } from '@/diveSites';

interface DiveSitesViewState {
  isLoading: boolean;
  sites: DiveSite[];
}

const diveSiteManager = inject(DiveSiteManagerKey);
const withErrorHandling = inject(WithErrorHandlingKey);
const state = reactive<DiveSitesViewState>({
  isLoading: true,
  sites: [],
});

async function refreshList() {
  state.isLoading = true;
  await withErrorHandling(async () => {
    state.sites = await diveSiteManager.searchDiveSites();
  });
  state.isLoading = false;
}

onMounted(async () => {
  await refreshList();
});
</script>
