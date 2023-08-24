<template>
  <PageTitle title="Dive Sites" />
  <section class="section">
    <div id="dive-sites-page" class="container">
      <div class="tile is-ancestor">
        <div class="tile is-parent is-3">
          <div class="tile is-child box is-info">
            <DiveSiteFilters />
          </div>
        </div>
        <div class="tile is-parent is-vertical is-9">
          <div class="tile is-child">
            <SearchBar autofocus @search="onSearch" />
          </div>

          <div class="tile is-child" role="toolbar">
            <div class="level">
              <div class="level-left">
                <div class="level-item">
                  <p title="Site Count" class="content">
                    Showing <strong>{{ state.sites.length }}</strong> dive
                    sites.
                  </p>
                </div>
              </div>

              <div class="level-right">
                <div class="level-item">
                  <RouterLink to="/diveSites/new">
                    <button class="button is-primary">
                      <span class="icon-text">
                        <span class="icon">
                          <i class="fas fa-plus"></i>
                        </span>
                        <span>Add Site</span>
                      </span>
                    </button>
                  </RouterLink>
                </div>
              </div>
            </div>
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
import { ApiClientKey, WithErrorHandlingKey } from '@/injection-keys';
import { inject } from '@/helpers';
import PageTitle from '@/components/PageTitle.vue';
import SearchBar from '@/components/forms/SearchBar.vue';
import { DiveSite, SearchDiveSitesOptions } from '@/client/diveSites';

interface DiveSitesViewState {
  filters: SearchDiveSitesOptions;
  isLoading: boolean;
  sites: DiveSite[];
}

const client = inject(ApiClientKey);
const withErrorHandling = inject(WithErrorHandlingKey);
const state = reactive<DiveSitesViewState>({
  filters: {
    query: '',
  },
  isLoading: true,
  sites: [],
});

async function refreshList() {
  state.isLoading = true;
  await withErrorHandling(async () => {
    state.sites = await client.diveSites.searchDiveSites(state.filters);
  });
  state.isLoading = false;
}

async function onSearch(queryString: string) {
  state.filters.query = queryString;
  await refreshList();
}

onMounted(async () => {
  await refreshList();
});
</script>
