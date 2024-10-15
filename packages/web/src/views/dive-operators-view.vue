<template>
  <div v-if="diveOperatorsEnabled.value">
    <PageTitle title="Dive Shops" />
    <BreadCrumbs :items="Breadcrumbs" />

    <DrawerPanel
      :full-screen="fullScreenUrl"
      :title="drawerPanelTitle"
      :visible="state.showPanel"
      @close="onCloseDrawer"
    >
      <template v-if="state.currentOperator">
        <EditDiveOperator
          v-if="isOperatorOwner"
          :is-saving="state.isSaving"
          :operator="state.currentOperator"
          @save="onSaveOperator"
        />
        <ViewDiveOperator v-else :operator="state.currentOperator" />
      </template>
    </DrawerPanel>

    <div class="grid gap-3 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
      <div class="col-span-1">
        <div class="sticky top-24">
          <OperatorsSearchForm
            :search-params="searchParams"
            @search="onSearch"
          />
        </div>
      </div>
      <div class="col-span-1 lg:col-span-2 xl:col-span-3">
        <DiveOperatorsList
          :is-loading-more="state.isLoadingMore"
          :operators="operators.results"
          @create-shop="onCreateShop"
          @load-more="onLoadMore"
          @select="onShopSelected"
        />
      </div>
    </div>
  </div>

  <NotFound v-else />
</template>

<script lang="ts" setup>
import {
  CreateOrUpdateDiveOperatorDTO,
  DiveOperatorDTO,
  SearchDiveOperatorsParams,
  SearchDiveOperatorsSchema,
  UserRole,
} from '@bottomtime/api';
import { ManageDiveOperatorsFeature } from '@bottomtime/common';

import { stringify } from 'qs';
import { computed, onServerPrefetch, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import DrawerPanel from '../components/common/drawer-panel.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import DiveOperatorsList from '../components/operators/dive-operators-list.vue';
import EditDiveOperator from '../components/operators/edit-dive-operator.vue';
import OperatorsSearchForm from '../components/operators/operators-search-form.vue';
import ViewDiveOperator from '../components/operators/view-dive-operator.vue';
import { useFeature } from '../featrues';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useCurrentUser, useDiveOperators, useToasts } from '../store';

interface DiveOperatorsViewState {
  currentOperator?: DiveOperatorDTO;
  isLoadingMore: boolean;
  isSaving: boolean;
  showPanel: boolean;
}

const OperatorSavedToastId = 'dive-operator-saved';
const Breadcrumbs: Breadcrumb[] = [
  { label: 'Dive Shops', to: '/shops', active: true },
] as const;

const diveOperatorsEnabled = useFeature(ManageDiveOperatorsFeature);
const client = useClient();
const currentUser = useCurrentUser();
const location = useLocation();
const oops = useOops();
const operators = useDiveOperators();
const route = useRoute();
const toasts = useToasts();

function parseQueryString(): SearchDiveOperatorsParams {
  const query = SearchDiveOperatorsSchema.safeParse(route.query);

  if (query.success) return query.data;

  /* eslint-disable-next-line no-console */
  console.warn('Unable to parse query string:', query.error.issues);
  return { limit: 50 };
}

const searchParams = reactive<SearchDiveOperatorsParams>(parseQueryString());
const state = reactive<DiveOperatorsViewState>({
  isLoadingMore: false,
  isSaving: false,
  showPanel: false,
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
    : '/newDiveShop',
);

async function refresh(): Promise<void> {
  await oops(async () => {
    const results = await client.diveOperators.searchDiveOperators({
      ...searchParams,
    });

    operators.results.operators = results.operators;
    operators.results.totalCount = results.totalCount;
  });
}

onServerPrefetch(async () => {
  await refresh();
});

function onSearch(params: SearchDiveOperatorsParams) {
  const qs = stringify({
    query: params.query || undefined,
    location: params.location
      ? `${params.location.lat},${params.location.lon}`
      : undefined,
    radius: params.radius || undefined,
    owner: params.owner || undefined,
    skip: searchParams.skip,
    limit: searchParams.limit,
  });
  location.assign(`${location.pathname}?${qs}`);
}

function onCloseDrawer() {
  state.showPanel = false;
}

function onCreateShop() {
  if (!currentUser.user) return;

  state.currentOperator = {
    createdAt: new Date(),
    id: '',
    name: '',
    owner: currentUser.user.profile,
    updatedAt: new Date(),
    verified: false,
    address: '',
    description: '',
    slug: '',
    socials: {},
  };
  state.showPanel = true;
}

function onShopSelected(dto: DiveOperatorDTO) {
  state.currentOperator = dto;
  state.showPanel = true;
}

async function onSaveOperator(
  dto: CreateOrUpdateDiveOperatorDTO,
): Promise<void> {
  state.isSaving = true;

  await oops(
    async () => {
      if (state.currentOperator?.id) {
        // Save existing
        const operator = client.diveOperators.wrapDTO(state.currentOperator);
        operator.name = dto.name;
        operator.slug = dto.slug;
        operator.description = dto.description;
        operator.address = dto.address;
        operator.phone = dto.phone;
        operator.email = dto.email;
        operator.website = dto.website;
        operator.gps = dto.gps;
        operator.socials = dto.socials;
        await operator.save();

        const index = operators.results.operators.findIndex(
          (op) => op.id === operator.id,
        );
        if (index > -1) {
          operators.results.operators[index] = operator.toJSON();
        }

        toasts.toast({
          id: OperatorSavedToastId,
          message: 'Changes to dive shop have been saved successfully.',
          type: ToastType.Success,
        });
      } else {
        // Create new dive operator.
        const newOperator = await client.diveOperators.createDiveOperator(dto);
        state.currentOperator = newOperator.toJSON();

        operators.results.operators.splice(0, 0, state.currentOperator);
        operators.results.totalCount++;

        toasts.toast({
          id: OperatorSavedToastId,
          message: 'New dive shop has been created.',
          type: ToastType.Success,
        });
      }

      state.showPanel = false;
    },
    {
      [409]: () => {
        toasts.toast({
          id: OperatorSavedToastId,
          message:
            'Unable to save dive shop. URL slug is already in use. Please change your slug to make it unique and then try again.',
          type: ToastType.Warning,
        });
      },
    },
  );

  state.isSaving = false;
}

async function onLoadMore(): Promise<void> {
  state.isLoadingMore = true;

  await oops(async () => {
    const params: SearchDiveOperatorsParams = {
      ...searchParams,
      skip: operators.results.operators.length,
    };
    const results = await client.diveOperators.searchDiveOperators(params);
    operators.results.operators.push(
      ...results.operators.map((op) => op.toJSON()),
    );
    operators.results.totalCount = results.totalCount;
  });

  state.isLoadingMore = false;
}
</script>
