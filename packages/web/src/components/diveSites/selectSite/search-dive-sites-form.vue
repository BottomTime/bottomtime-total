<template>
  <div class="space-y-4">
    <form class="space-y-4" @submit.prevent="onSearch">
      <FormSearchBox
        v-model="state.search"
        control-id="siteSearchQuery"
        test-id="site-search-query"
        placeholder="Search for a dive site..."
        autofocus
        @search="onSearch"
      />

      <div class="px-16 space-y-1.5">
        <GoogleMap
          :marker="state.location"
          :sites="state.sites?.data"
          @click="onLocationChange"
          @site-selected="onSiteHighlighted"
        />
        <p class="text-sm text-center italic" italic>
          Click a place on the map to center your search around that point.
        </p>

        <FormField
          label="Search radius (km)"
          control-id="site-search-radius"
          :responsive="false"
          required
        >
          <FormSlider
            v-model="state.radius"
            control-id="site-search-radius"
            test-id="site-search-radius"
            :min="10"
            :max="500"
            :step="10"
          />
        </FormField>
      </div>

      <div class="text-center">
        <FormButton
          type="primary"
          control-id="searchSites"
          test-id="search-sites"
          @click="onSearch"
        >
          Search
        </FormButton>
      </div>
    </form>

    <div v-if="state.isSearching" class="text-center">
      <LoadingSpinner message="Searching..." />
    </div>

    <div v-else-if="state.sites">
      <p class="text-center my-1.5" data-testid="search-sites-counts">
        <span>Showing </span>
        <span class="font-bold">{{ state.sites.data.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ state.sites.totalCount }}</span>
        <span> dive sites.</span>
      </p>

      <ul
        v-if="state.sites.totalCount"
        class="*:odd:bg-blue-300/40 *:odd:dark:bg-blue-900/40"
        data-testid="search-sites-results-list"
      >
        <SelectDiveSiteListItem
          v-for="site in state.sites.data"
          :key="site.id"
          :site="site"
          :selected="site.id === state.selectedSite"
          @highlight="onSiteHighlighted"
          @select="(site) => $emit('site-selected', site)"
        />

        <li
          v-if="state.sites.data.length < state.sites.totalCount"
          class="py-12 text-center"
        >
          <LoadingSpinner
            v-if="state.isLoadingMore"
            message="Loading more results..."
          />
          <FormButton
            v-else
            type="link"
            size="lg"
            control-id="searchSitesLoadMore"
            test-id="search-sites-load-more"
            @click="onLoadMore"
          >
            Load more...
          </FormButton>
        </li>
      </ul>

      <div
        v-else
        class="my-6 text-lg italic flex gap-2 justify-center"
        data-testid="search-sites-no-results"
      >
        <span class="mt-1">
          <i class="fa-solid fa-circle-info"></i>
        </span>
        <div class="italic">
          <p>No sites were found that match your search criteria.</p>
          <p>
            Try widening your search preferences, or if you can't find the site
            you're looking for, try
            <NavLink @click="$emit('create')">creating it</NavLink>!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ApiList,
  DiveSiteDTO,
  GpsCoordinates,
  SearchDiveSitesParamsDTO,
  SuccinctDiveSiteDTO,
} from '@bottomtime/api';

import { reactive } from 'vue';

import { useClient } from '../../../api-client';
import { useOops } from '../../../oops';
import FormButton from '../../common/form-button.vue';
import FormField from '../../common/form-field.vue';
import FormSearchBox from '../../common/form-search-box.vue';
import FormSlider from '../../common/form-slider.vue';
import GoogleMap from '../../common/google-map.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import NavLink from '../../common/nav-link.vue';
import SelectDiveSiteListItem from './select-dive-site-list-item.vue';

interface SelectDiveSiteListState {
  isLoadingMore: boolean;
  isSearching: boolean;
  location?: GpsCoordinates;
  radius: number;
  search: string;
  selectedSite?: string;
  sites?: ApiList<DiveSiteDTO>;
}

const client = useClient();
const oops = useOops();

defineEmits<{
  (e: 'create'): void;
  (e: 'site-selected', site: SuccinctDiveSiteDTO): void;
}>();

const state = reactive<SelectDiveSiteListState>({
  isLoadingMore: false,
  isSearching: false,
  radius: 100,
  search: '',
});

function onLocationChange(location?: GpsCoordinates): void {
  state.location = location;
}

function getSearchParams(): SearchDiveSitesParamsDTO {
  return {
    query: state.search || undefined,
    location: state.location,
    radius: state.location ? state.radius : undefined,
    limit: 30,
  };
}

async function onSearch(): Promise<void> {
  state.isSearching = true;

  await oops(async () => {
    state.sites = await client.diveSites.searchDiveSites(getSearchParams());
  });

  state.isSearching = false;
}

async function onLoadMore(): Promise<void> {
  state.isLoadingMore = true;

  await oops(async () => {
    const results = await client.diveSites.searchDiveSites({
      ...getSearchParams(),
      skip: state.sites?.data.length,
    });
    state.sites!.data.push(...results.data);
    state.sites!.totalCount = results.totalCount;
  });

  state.isLoadingMore = false;
}

function onSiteHighlighted(site: SuccinctDiveSiteDTO): void {
  state.selectedSite = site.id;
}
</script>
