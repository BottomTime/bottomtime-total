<template>
  <DrawerPanel
    :visible="!!state.selectedSite"
    :title="state.selectedSite?.name"
    :full-screen="`/diveSites/${state.selectedSite?.id}`"
    @close="state.selectedSite = undefined"
  >
    <ViewDiveSite
      v-if="state.selectedSite"
      :site="state.selectedSite"
      :columns="false"
    />
  </DrawerPanel>

  <PageTitle title="Dive Sites" />
  <div class="grid gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-5">
    <FormBox class="w-full sticky top-16 z-[40]">
      <SearchDiveSitesForm :params="state.searchParams" @search="onSearch" />
    </FormBox>

    <div class="col-span-1 lg:col-span-2 xl:col-span-4">
      <FormBox
        class="flex flex-col justify-between items-center md:flex-row md:justify-between md:items-baseline gap-1 sticky top-28 lg:top-16 shadow-lg z-[40]"
      >
        <p>
          <span>Showing </span>
          <span class="font-bold">{{ state.results.data.length }}</span>
          <span> of </span>
          <span class="font-bold">{{ state.results.totalCount }}</span>
          <span> dive sites</span>
        </p>

        <div class="flex gap-2 items-baseline">
          <label for="sort-order" class="font-bold">Sort order:</label>
          <FormSelect
            v-model="selectedSortOrder"
            control-id="sort-order"
            test-id="sort-order"
            :options="SortOrderOptions"
          />
          <FormButton
            v-if="!currentUser.anonymous"
            type="primary"
            test-id="create-dive-site"
            @click="onCreateSite"
          >
            <p class="space-x-1">
              <span>
                <i class="fa-solid fa-plus"></i>
              </span>
              <span>Create Site</span>
            </p>
          </FormButton>
        </div>
      </FormBox>

      <DiveSitesList
        :sites="state.results"
        :is-loading-more="state.isLoadingMore"
        @site-selected="(site) => (state.selectedSite = site)"
        @load-more="onLoadMore"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ApiList,
  DiveSiteDTO,
  DiveSitesSortBy,
  SearchDiveSitesParamsDTO,
  SearchDiveSitesParamsSchema,
  SortOrder,
} from '@bottomtime/api';

import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { SelectOption } from '../../common';
import DrawerPanel from '../../components/common/drawer-panel.vue';
import FormBox from '../../components/common/form-box.vue';
import FormButton from '../../components/common/form-button.vue';
import FormSelect from '../../components/common/form-select.vue';
import PageTitle from '../../components/common/page-title.vue';
import DiveSitesList from '../../components/diveSites/dive-sites-list.vue';
import SearchDiveSitesForm from '../../components/diveSites/search-dive-sites-form.vue';
import ViewDiveSite from '../../components/diveSites/view-dive-site.vue';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';

interface DiveSitesViewState {
  selectedSite?: DiveSiteDTO;
  isLoading: boolean;
  isLoadingMore: boolean;
  searchParams: SearchDiveSitesParamsDTO;
  results: ApiList<DiveSiteDTO>;
}

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
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();
const router = useRouter();

function parseQueryString(): SearchDiveSitesParamsDTO {
  const query = SearchDiveSitesParamsSchema.safeParse(
    router.currentRoute.value.query,
  );

  return query.success ? query.data : {};
}

const state = reactive<DiveSitesViewState>({
  isLoading: true,
  isLoadingMore: false,
  searchParams: parseQueryString(),
  results: {
    data: [],
    totalCount: 0,
  },
});
const selectedSortOrder = ref(
  `${state.searchParams.sortBy || DiveSitesSortBy.Rating}-${
    state.searchParams.sortOrder || SortOrder.Descending
  }`,
);

async function refresh(): Promise<void> {
  state.isLoading = true;

  await oops(async () => {
    state.results = await client.diveSites.searchDiveSites(state.searchParams);
  });

  state.isLoading = false;
}

async function onSearch(params: SearchDiveSitesParamsDTO): Promise<void> {
  state.searchParams.query = params.query;
  state.searchParams.rating = params.rating;
  state.searchParams.difficulty = params.difficulty;
  state.searchParams.shoreAccess = params.shoreAccess;
  state.searchParams.freeToDive = params.freeToDive;
  state.searchParams.location = params.location;
  state.searchParams.radius = params.radius;

  await router.push({
    path: route.path,
    query: client.diveSites.searchQueryString(state.searchParams),
  });
  await refresh();
}

async function onLoadMore(): Promise<void> {
  state.isLoadingMore = true;

  await oops(async () => {
    const params = {
      ...state.searchParams,
      skip: state.results.data.length,
    };
    const newResults = await client.diveSites.searchDiveSites(params);

    state.results.data.push(...newResults.data);
    state.results.totalCount = newResults.totalCount;
  });

  state.isLoadingMore = false;
}

async function onCreateSite(): Promise<void> {
  await router.push('/diveSites/new');
}

onMounted(refresh);

watch(selectedSortOrder, async (value) => {
  const [sortBy, sortOrder] = value.split('-');
  state.searchParams.sortBy = sortBy as DiveSitesSortBy;
  state.searchParams.sortOrder = sortOrder as SortOrder;

  await router.push({
    path: route.path,
    query: client.diveSites.searchQueryString(state.searchParams),
  });
  await refresh();
});
</script>
