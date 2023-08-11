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
            <SearchBar autofocus @search="onSearch" />
          </div>
          <div class="tile is-child">
            <DiveSiteList :isLoading="data.isLoading" :sites="data.sites" />
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
import { DiveSite, DiveSiteSearchOptions } from '@/diveSites';

interface DiveSitesViewData {
  filters: DiveSiteSearchOptions;
  isLoading: boolean;
  sites: DiveSite[];
}

const diveSiteManager = inject(DiveSiteManagerKey);
const withErrorHandling = inject(WithErrorHandlingKey);
const data = reactive<DiveSitesViewData>({
  filters: {
    query: '',
  },
  isLoading: true,
  sites: [],
});

async function refreshList() {
  data.isLoading = true;
  await withErrorHandling(async () => {
    data.sites = await diveSiteManager.searchDiveSites(data.filters);
  });
  data.isLoading = false;
}

async function onSearch(queryString: string) {
  data.filters.query = queryString;
  await refreshList();
}

onMounted(async () => {
  await refreshList();
});
</script>
