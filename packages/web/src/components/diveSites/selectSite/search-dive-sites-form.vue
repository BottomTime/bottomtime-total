<template>
  <div class="space-y-4">
    <form @submit.prevent="">
      <fieldset
        class="space-y-4"
        :disabled="state.isSearching || isAddingSites"
      >
        <FormField label="Search">
          <FormSearchBox
            v-model="state.search"
            control-id="siteSearchQuery"
            test-id="site-search-query"
            placeholder="Search for a dive site..."
            autofocus
            @search="onSearch"
          />
        </FormField>

        <FormField label="Location">
          <FormLocationPicker
            v-model="state.location"
            class="max-w-[360px]"
            show-radius
          />
        </FormField>

        <div class="text-center">
          <FormButton
            class="space-x-1"
            :type="state.sites ? 'normal' : 'primary'"
            :is-loading="state.isSearching"
            control-id="searchSites"
            test-id="search-sites"
            submit
            @click="onSearch"
          >
            <span>
              <i class="fa-solid fa-magnifying-glass"></i>
            </span>
            <span>Search</span>
          </FormButton>
        </div>
      </fieldset>
    </form>

    <div v-if="state.sites">
      <FormBox class="flex items-baseline justify-between">
        <p data-testid="search-sites-counts">
          <span>Showing </span>
          <span class="font-bold">{{ state.sites.data.length }}</span>
          <span> of </span>
          <span class="font-bold">{{ state.sites.totalCount }}</span>
          <span> dive sites.</span>
        </p>

        <div v-if="multiSelect">
          <FormButton
            :disabled="!sitesSelected || isAddingSites"
            :is-loading="isAddingSites"
            size="sm"
            type="primary"
            @click="onAddCheckedSites"
          >
            Add selected sites
          </FormButton>
        </div>
      </FormBox>

      <TransitionList
        v-if="state.sites.totalCount"
        class="px-2"
        data-testid="search-sites-results-list"
      >
        <SelectDiveSiteListItem
          v-for="site in state.sites.data"
          :key="site.id"
          :site="site"
          :selected="site.id === state.selectedSite"
          :multi-select="multiSelect"
          @highlight="onSiteHighlighted"
          @select="(site) => $emit('site-selected', site)"
          @toggle-checked="onSiteCheckmarkToggled"
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
      </TransitionList>

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
  GpsCoordinatesWithRadius,
  SearchDiveSitesParamsDTO,
} from '@bottomtime/api';

import { computed, onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { useGeolocation } from '../../../geolocation';
import { useOops } from '../../../oops';
import FormBox from '../../common/form-box.vue';
import FormButton from '../../common/form-button.vue';
import FormField from '../../common/form-field.vue';
import FormLocationPicker from '../../common/form-location-picker.vue';
import FormSearchBox from '../../common/form-search-box.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import NavLink from '../../common/nav-link.vue';
import TransitionList from '../../common/transition-list.vue';
import SelectDiveSiteListItem from './select-dive-site-list-item.vue';

interface SelectDiveSiteListProps {
  isAddingSites?: boolean;
  multiSelect: boolean;
}

interface SelectDiveSiteListState {
  isLoadingMore: boolean;
  isSearching: boolean;
  location?: GpsCoordinatesWithRadius;
  mapCenter?: GpsCoordinates;
  search: string;
  selectedSite?: string;
  sites?: ApiList<DiveSiteDTO & { selected?: boolean }>;
}

const client = useClient();
const geolocation = useGeolocation();
const oops = useOops();

const emit = defineEmits<{
  (e: 'add', sites: DiveSiteDTO[]): void;
  (e: 'create'): void;
  (e: 'site-selected', site: DiveSiteDTO): void;
}>();

withDefaults(defineProps<SelectDiveSiteListProps>(), {
  isAddingSites: false,
  multiSelect: false,
});
const state = reactive<SelectDiveSiteListState>({
  isLoadingMore: false,
  isSearching: false,
  search: '',
});

const sitesSelected = computed(
  () => state.sites?.data.some((site) => site.selected) ?? false,
);

function getSearchParams(): SearchDiveSitesParamsDTO {
  return {
    query: state.search || undefined,
    location: state.location
      ? { lat: state.location.lat, lon: state.location.lon }
      : undefined,
    radius: state.location?.radius,
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
    const search = {
      ...getSearchParams(),
      skip: state.sites?.data.length,
    };
    const results = await client.diveSites.searchDiveSites(search);
    state.sites!.data.push(...results.data);
    state.sites!.totalCount = results.totalCount;
  });

  state.isLoadingMore = false;
}

function onSiteHighlighted(site: DiveSiteDTO): void {
  state.selectedSite = site.id;
}

function onSiteCheckmarkToggled(
  site: DiveSiteDTO & { selected?: boolean },
): void {
  site.selected = !site.selected;
}

function onAddCheckedSites(): void {
  emit('add', state.sites?.data.filter((site) => site.selected) ?? []);
}

onMounted(() => {
  geolocation.getCurrentLocation().then((location) => {
    state.location = location;
    state.mapCenter = location;
  });
});
</script>
