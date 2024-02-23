<template>
  <DrawerPanel
    :visible="!!selectedSite"
    :title="selectedSite?.name"
    :full-screen="`/diveSites/${selectedSite?.id}`"
    @close="selectedSite = null"
  >
    <ViewDiveSite v-if="selectedSite" :site="selectedSite" />
  </DrawerPanel>

  <PageTitle title="Dive Sites" />
  <div class="grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
    <FormBox class="w-full">
      <SearchDiveSitesForm
        class="sticky top-20"
        :params="searchParams"
        @search="onSearch"
      />
    </FormBox>
    <div class="md:col-span-2 lg:col-span-4">
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
      </FormBox>
      <DiveSitesList
        :data="data"
        :is-loading="isLoading"
        @site-selected="(site) => (selectedSite = site)"
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

import {
  onBeforeMount,
  onServerPrefetch,
  reactive,
  ref,
  useSSRContext,
} from 'vue';
import { useRouter } from 'vue-router';

import { useClient } from '../client';
import { AppInitialState, SelectOption } from '../common';
import DrawerPanel from '../components/common/drawer-panel.vue';
import FormBox from '../components/common/form-box.vue';
import FormSelect from '../components/common/form-select.vue';
import PageTitle from '../components/common/page-title.vue';
import DiveSitesList from '../components/diveSites/dive-sites-list.vue';
import SearchDiveSitesForm from '../components/diveSites/search-dive-sites-form.vue';
import ViewDiveSite from '../components/diveSites/view-dive-site.vue';
import { Config } from '../config';
import { useInitialState } from '../initial-state';
import { useOops } from '../oops';

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
const initialState = useInitialState();
const oops = useOops();
const router = useRouter();

const data = ref<SearchDiveSitesResponseDTO>({
  sites: [],
  totalCount: 0,
});
const searchParams = reactive<SearchDiveSitesParamsDTO>({
  sortBy: DiveSitesSortBy.Name,
  sortOrder: SortOrder.Ascending,
  limit: 100,
});
const isLoading = ref(false);
const selectedSortOrder = ref(SortOrderOptions[0].value);
const selectedSite = ref<DiveSiteDTO | null>(null);

async function refreshDiveSites(): Promise<void> {
  isLoading.value = true;
  selectedSite.value = null;

  const query = SearchDiveSitesParamsSchema.safeParse(
    router.currentRoute.value.query,
  );
  if (query.success) {
    searchParams.creator = query.data.creator;
    searchParams.difficulty = query.data.difficulty;
    searchParams.freeToDive = query.data.freeToDive;
    searchParams.limit = query.data.limit;
    searchParams.location = query.data.location;
    searchParams.query = query.data.query;
    searchParams.radius = query.data.radius;
    searchParams.rating = query.data.rating;
    searchParams.shoreAccess = query.data.shoreAccess;
    searchParams.skip = query.data.skip;
    searchParams.sortBy = query.data.sortBy;
    searchParams.sortOrder = query.data.sortOrder;
  }

  await oops(async () => {
    const newPath = `${
      router.currentRoute.value.path
    }?${client.diveSites.searchQueryString(searchParams)}`;
    await router.push(newPath);

    const results = await client.diveSites.searchDiveSites(searchParams);
    data.value = {
      sites: results.sites.map((site) => site.toJSON()),
      totalCount: results.totalCount,
    };
  });

  isLoading.value = false;
}

async function onChangeSortOrder(): Promise<void> {
  const [sortBy, sortOrder] = selectedSortOrder.value.split('-');
  searchParams.sortBy = sortBy as DiveSitesSortBy;
  searchParams.sortOrder = sortOrder as SortOrder;

  const newPath = `${
    router.currentRoute.value.path
  }?${client.diveSites.searchQueryString(searchParams)}`;
  await router.push(newPath);
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
  await router.push(newPath);
}

onBeforeMount(async () => {
  if (!Config.isSSR && initialState?.diveSites) {
    data.value = initialState.diveSites;
    router.afterEach(refreshDiveSites);
  }
});

onServerPrefetch(async () => {
  if (ctx) {
    await oops(async () => {
      await refreshDiveSites();
      ctx.diveSites = data.value;
    });
  }
});
</script>
