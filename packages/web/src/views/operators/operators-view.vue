<template>
  <ConfirmDialog
    confirm-text="Delete"
    title="Delete Dive Shop?"
    dangerous
    icon="fa-solid fa-trash fa-2x"
    :visible="state.showConfirmDelete"
    :is-loading="state.isDeleting"
    @confirm="onConfirmDelete"
    @cancel="onCancelDelete"
  >
    <p>
      Are you sure you want to delete
      <span class="font-bold">{{ state.currentOperator?.name }}</span>
      ?
    </p>
    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <PageTitle title="Dive Shops" />
  <BreadCrumbs :items="Breadcrumbs" />

  <DrawerPanel
    :full-screen="isOperatorOwner ? undefined : fullScreenUrl"
    :edit="isOperatorOwner ? fullScreenUrl : undefined"
    :title="drawerPanelTitle"
    :visible="state.showPanel"
    @close="onCloseDrawer"
  >
    <ViewOperator
      v-if="state.currentOperator"
      :operator="state.currentOperator"
    />
  </DrawerPanel>

  <div class="grid gap-3 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
    <div class="col-span-1">
      <div class="sticky top-16">
        <OperatorsSearchForm :search-params="searchParams" @search="onSearch" />
      </div>
    </div>
    <div class="col-span-1 lg:col-span-2 xl:col-span-3">
      <OperatorsList
        :is-loading="state.isLoading"
        :is-loading-more="state.isLoadingMore"
        :operators="state.results"
        :map-center="state.mapCenter"
        @load-more="onLoadMore"
        @select="onShopSelected"
        @delete="onDelete"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ApiList,
  GpsCoordinates,
  OperatorDTO,
  SearchOperatorsParams,
  SearchOperatorsSchema,
  UserRole,
} from '@bottomtime/api';

import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb, ToastType } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import DrawerPanel from '../../components/common/drawer-panel.vue';
import PageTitle from '../../components/common/page-title.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import OperatorsList from '../../components/operators/operators-list.vue';
import OperatorsSearchForm from '../../components/operators/operators-search-form.vue';
import ViewOperator from '../../components/operators/view-operator.vue';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';

interface OperatorsViewState {
  currentOperator?: OperatorDTO;
  isDeleting: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isSaving: boolean;
  mapCenter?: GpsCoordinates;
  results: ApiList<OperatorDTO>;
  showPanel: boolean;
  showConfirmDelete: boolean;
}

const Breadcrumbs: Breadcrumb[] = [
  { label: 'Dive Shops', to: '/shops', active: true },
] as const;

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();
const router = useRouter();
const toasts = useToasts();

function parseQueryString(): SearchOperatorsParams {
  const query = SearchOperatorsSchema.safeParse(route.query);
  if (query.success)
    return {
      ...query.data,
      limit: query.data.limit ?? 50,
    };
  return { limit: 50 };
}

const searchParams = reactive<SearchOperatorsParams>(parseQueryString());
const state = reactive<OperatorsViewState>({
  isDeleting: false,
  isLoading: true,
  isLoadingMore: false,
  isSaving: false,
  results: {
    data: [],
    totalCount: 0,
  },
  showPanel: false,
  showConfirmDelete: false,
});
const isOperatorOwner = computed(
  () =>
    currentUser.user?.role === UserRole.Admin ||
    state.currentOperator?.owner.userId === currentUser.user?.id,
);
const drawerPanelTitle = computed(() => {
  if (!state.currentOperator?.id) {
    return 'Create New Dive Shop';
  }

  if (isOperatorOwner.value) {
    return `Edit "${state.currentOperator.name}"`;
  }

  return state.currentOperator.name;
});
const fullScreenUrl = computed(() =>
  state.currentOperator?.id
    ? `/shops/${state.currentOperator.slug}`
    : '/shops/createNew',
);

async function refresh(): Promise<void> {
  state.isLoading = true;
  await oops(async () => {
    state.results = await client.operators.searchOperators({
      ...searchParams,
    });
  });
  state.isLoading = false;
}

async function onSearch(params: SearchOperatorsParams): Promise<void> {
  await router.push({
    path: route.path,
    query: {
      query: params.query || undefined,
      location: params.location
        ? encodeURIComponent(`${params.location.lat},${params.location.lon}`)
        : undefined,
      radius: params.radius || undefined,
      owner: params.owner || undefined,
      showInactive: params.showInactive ? 'true' : undefined,
      verification: params.verification || undefined,
      skip: searchParams.skip,
      limit: searchParams.limit,
    },
  });

  searchParams.query = params.query;
  searchParams.location = params.location;
  searchParams.limit = params.limit;
  searchParams.owner = params.owner;
  searchParams.radius = params.radius;
  searchParams.showInactive = params.showInactive;
  searchParams.verification = params.verification;
  searchParams.skip = params.skip;
  searchParams.limit = params.limit;

  if (searchParams.location) state.mapCenter = searchParams.location;

  await refresh();
}

function onCloseDrawer() {
  state.showPanel = false;
}

function onShopSelected(dto: OperatorDTO) {
  state.currentOperator = dto;
  state.showPanel = true;
}

async function onLoadMore(): Promise<void> {
  state.isLoadingMore = true;

  await oops(async () => {
    const params: SearchOperatorsParams = {
      ...searchParams,
      skip: state.results.data.length,
    };
    const results = await client.operators.searchOperators(params);
    state.results.data.push(...results.data);
    state.results.totalCount = results.totalCount;
  });

  state.isLoadingMore = false;
}

function onDelete(operator: OperatorDTO): void {
  state.currentOperator = operator;
  state.showConfirmDelete = true;
}

function onCancelDelete() {
  state.showConfirmDelete = false;
}

async function onConfirmDelete(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    if (!state.currentOperator) return;

    await client.operators.deleteOperator(state.currentOperator.slug);

    toasts.toast({
      id: 'operator-deleted',
      message: 'Dive shop has been deleted.',
      type: ToastType.Success,
    });

    const index = state.results.data.findIndex(
      (op) => op.id === state.currentOperator?.id,
    );
    if (index > -1) {
      state.results.data.splice(index, 1);
      state.results.totalCount--;
    }

    state.showPanel = false;
    state.currentOperator = undefined;
    state.showConfirmDelete = false;
  });

  state.isDeleting = false;
}

onMounted(refresh);
</script>
