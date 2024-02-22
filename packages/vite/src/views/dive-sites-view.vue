<template>
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
        class="flex flex-row gap-2 sticky top-16 items-baseline shadow-lg"
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
      <DiveSitesList :data="data" :is-loading="isLoading" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  DiveSitesSortBy,
  SearchDiveSitesParamsDTO,
  SearchDiveSitesResponseDTO,
  SortOrder,
} from '@bottomtime/api';

import { onBeforeMount, onServerPrefetch, reactive, ref } from 'vue';

import { useClient } from '../client';
import { SelectOption } from '../common';
import FormBox from '../components/common/form-box.vue';
import FormSelect from '../components/common/form-select.vue';
import PageTitle from '../components/common/page-title.vue';
import DiveSitesList from '../components/diveSites/dive-sites-list.vue';
import SearchDiveSitesForm from '../components/diveSites/search-dive-sites-form.vue';
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
const oops = useOops();

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

async function refreshDiveSites(): Promise<void> {
  isLoading.value = true;

  await oops(async () => {
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

  await refreshDiveSites();
}

async function onSearch(params: SearchDiveSitesParamsDTO): Promise<void> {
  searchParams.query = params.query;
  searchParams.rating = params.rating;
  searchParams.difficulty = params.difficulty;
  searchParams.shoreAccess = params.shoreAccess;
  searchParams.freeToDive = params.freeToDive;
  searchParams.location = params.location;
  await refreshDiveSites();
}

onBeforeMount(async () => {
  await refreshDiveSites();
});

onServerPrefetch(async () => {
  // TODO
  // await refreshDiveSites();
});
</script>
