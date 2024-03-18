<template>
  <DrawerPanel
    :visible="!!selectedSite"
    :title="selectedSite?.name"
    :full-screen="`/diveSites/${selectedSite?.id}`"
    @close="selectedSite = null"
  >
    <ViewDiveSite v-if="selectedSite" :site="selectedSite" :columns="false" />
  </DrawerPanel>

  <PageTitle title="Dive Sites" />
  <div class="grid gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-5">
    <FormBox class="w-full">
      <SearchDiveSitesForm :params="searchParams" @search="onSearch" />
    </FormBox>

    <div class="lg:col-span-2 xl:col-span-4">
      <FormBox
        class="flex flex-row gap-2 sticky top-16 items-baseline shadow-lg z-30"
      >
        <span class="font-bold">Showing Dive Sites:</span>
        <span>{{ data.sites.length }}</span>
        <span>of</span>
        <span class="grow">{{ data.totalCount }}</span>
        <label for="sort-order" class="font-bold">Sort order:</label>
        <FormSelect
          v-model="selectedSortOrder"
          control-id="sort-order"
          test-id="sort-order"
          :options="SortOrderOptions"
          @change="onChangeSortOrder"
        />
        <FormButton
          v-if="!currentUser.anonymous"
          type="primary"
          test-id="create-dive-site"
          @click="onCreateSite"
        >
          Create Site
        </FormButton>
      </FormBox>

      <DiveSitesList
        :data="data"
        :is-loading-more="isLoadingMore"
        @site-selected="(site) => (selectedSite = site)"
        @load-more="onLoadMore"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  DiveSiteDTO,
  DiveSitesSortBy,
  SearchDiveSitesParamsDTO,
  SearchDiveSitesParamsSchema,
  SearchDiveSitesResponseDTO,
  SortOrder,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, ref, useSSRContext } from 'vue';
import { useRouter } from 'vue-router';

import { useClient } from '../client';
import { SelectOption } from '../common';
import DrawerPanel from '../components/common/drawer-panel.vue';
import FormBox from '../components/common/form-box.vue';
import FormButton from '../components/common/form-button.vue';
import FormSelect from '../components/common/form-select.vue';
import PageTitle from '../components/common/page-title.vue';
import DiveSitesList from '../components/diveSites/dive-sites-list.vue';
import SearchDiveSitesForm from '../components/diveSites/search-dive-sites-form.vue';
import ViewDiveSite from '../components/diveSites/view-dive-site.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

const SortOrderOptions: SelectOption[] = [
  {
    value: `${DiveSitesSortBy.Name}-${SortOrder.Ascending}`,
    label: 'Name (A-Z)',
  },
  {
    value: `${DiveSitesSortBy.Name}-${SortOrder.Descending}`,
    label: 'Name (Z-A)',
  },
  {
    value: `${DiveSitesSortBy.Rating}-${SortOrder.Descending}`,
    label: 'Rating (High to Low)',
  },
  {
    value: `${DiveSitesSortBy.Rating}-${SortOrder.Ascending}`,
    label: 'Rating (Low to High)',
  },
];

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : undefined;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const location = useLocation();
const oops = useOops();
const router = useRouter();

function parseQueryString(): SearchDiveSitesParamsDTO {
  const query = SearchDiveSitesParamsSchema.safeParse(
    router.currentRoute.value.query,
  );

  return query.success ? query.data : {};
}

const searchParams = reactive<SearchDiveSitesParamsDTO>(parseQueryString());
const selectedSortOrder = ref(
  `${searchParams.sortBy || DiveSitesSortBy.Rating}-${
    searchParams.sortOrder || SortOrder.Descending
  }`,
);
const selectedSite = ref<DiveSiteDTO | null>(null);
const isLoadingMore = ref(false);

const data = ref<SearchDiveSitesResponseDTO>(
  !Config.isSSR && initialState?.diveSites
    ? initialState.diveSites
    : {
        sites: [],
        totalCount: 0,
      },
);

async function onChangeSortOrder(): Promise<void> {
  const [sortBy, sortOrder] = selectedSortOrder.value.split('-');
  searchParams.sortBy = sortBy as DiveSitesSortBy;
  searchParams.sortOrder = sortOrder as SortOrder;

  const newPath = `${
    router.currentRoute.value.path
  }?${client.diveSites.searchQueryString(searchParams)}`;
  await location.assign(newPath);
}

async function onSearch(params: SearchDiveSitesParamsDTO): Promise<void> {
  searchParams.query = params.query;
  searchParams.rating = params.rating;
  searchParams.difficulty = params.difficulty;
  searchParams.shoreAccess = params.shoreAccess;
  searchParams.freeToDive = params.freeToDive;
  searchParams.location = params.location;
  searchParams.radius = params.radius;

  const newPath = `${
    router.currentRoute.value.path
  }?${client.diveSites.searchQueryString(searchParams)}`;
  location.assign(newPath);
}

async function onLoadMore(): Promise<void> {
  isLoadingMore.value = true;

  await oops(async () => {
    const params = {
      ...searchParams,
      skip: data.value.sites.length,
    };
    const newResults = await client.diveSites.searchDiveSites(params);

    data.value.sites.push(...newResults.sites.map((site) => site.toJSON()));
    data.value.totalCount = newResults.totalCount;
  });

  isLoadingMore.value = false;
}

function onCreateSite(): void {
  location.assign('/diveSites/new');
}

onServerPrefetch(async () => {
  await oops(async () => {
    const results = await client.diveSites.searchDiveSites(searchParams);
    data.value = {
      sites: results.sites.map((site) => site.toJSON()),
      totalCount: results.totalCount,
    };
    if (ctx) ctx.diveSites = data.value;
  });
});
</script>
