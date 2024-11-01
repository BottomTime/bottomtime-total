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

  <template v-if="diveOperatorsEnabled.value">
    <PageTitle title="Dive Shops" />
    <BreadCrumbs :items="Breadcrumbs" />

    <DrawerPanel
      :full-screen="fullScreenUrl"
      :title="drawerPanelTitle"
      :visible="state.showPanel"
      @close="onCloseDrawer"
    >
      <template v-if="state.currentOperator">
        <EditOperator
          v-if="isOperatorOwner"
          :is-saving="state.isSaving"
          :operator="state.currentOperator"
          @save="onSaveOperator"
          @delete="onDelete"
          @logo-changed="onLogoChanged"
          @verification-requested="onVerificationRequested"
          @verified="onVerified"
          @rejected="onVerificationRejected"
        />
        <ViewOperator v-else :operator="state.currentOperator" />
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
        <OperatorsList
          :is-loading="state.isLoading"
          :is-loading-more="state.isLoadingMore"
          :operators="operators.results"
          @create-shop="onCreateShop"
          @load-more="onLoadMore"
          @select="onShopSelected"
          @delete="onDelete"
        />
      </div>
    </div>
  </template>

  <NotFound v-else />
</template>

<script lang="ts" setup>
import {
  CreateOrUpdateOperatorDTO,
  OperatorDTO,
  SearchOperatorsParams,
  SearchOperatorsSchema,
  UserRole,
  VerificationStatus,
} from '@bottomtime/api';
import { ManageDiveOperatorsFeature } from '@bottomtime/common';

import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb, ToastType } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import DrawerPanel from '../../components/common/drawer-panel.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import EditOperator from '../../components/operators/edit-operator.vue';
import OperatorsList from '../../components/operators/operators-list.vue';
import OperatorsSearchForm from '../../components/operators/operators-search-form.vue';
import ViewOperator from '../../components/operators/view-operator.vue';
import { useFeature } from '../../featrues';
import { useOops } from '../../oops';
import { useCurrentUser, useOperators, useToasts } from '../../store';

interface OperatorsViewState {
  currentOperator?: OperatorDTO;
  isDeleting: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isSaving: boolean;
  showPanel: boolean;
  showConfirmDelete: boolean;
}

const OperatorSavedToastId = 'dive-operator-saved';
const Breadcrumbs: Breadcrumb[] = [
  { label: 'Dive Shops', to: '/shops', active: true },
] as const;

const diveOperatorsEnabled = useFeature(ManageDiveOperatorsFeature);
const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const operators = useOperators();
const route = useRoute();
const router = useRouter();
const toasts = useToasts();

function parseQueryString(): SearchOperatorsParams {
  const query = SearchOperatorsSchema.safeParse(route.query);

  if (query.success) return query.data;

  /* eslint-disable-next-line no-console */
  console.warn('Unable to parse query string:', query.error.issues);
  return { limit: 50 };
}

const searchParams = reactive<SearchOperatorsParams>(parseQueryString());
const state = reactive<OperatorsViewState>({
  isDeleting: false,
  isLoading: false,
  isLoadingMore: false,
  isSaving: false,
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
    const results = await client.operators.searchOperators({
      ...searchParams,
    });

    operators.results.operators = results.operators.map((op) => op.toJSON());
    operators.results.totalCount = results.totalCount;
  });
  state.isLoading = false;
}

onMounted(async (): Promise<void> => {
  await refresh();
});

async function onSearch(params: SearchOperatorsParams): Promise<void> {
  await router.push({
    path: route.path,
    query: {
      query: params.query || undefined,
      location: params.location
        ? `${params.location.lat},${params.location.lon}`
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
  await refresh();
}

function onCloseDrawer() {
  state.showPanel = false;
}

function onCreateShop() {
  if (!currentUser.user) return;

  state.currentOperator = {
    active: true,
    createdAt: new Date(),
    id: '',
    name: '',
    owner: currentUser.user.profile,
    updatedAt: new Date(),
    verificationStatus: VerificationStatus.Unverified,
    address: '',
    description: '',
    slug: '',
    socials: {},
  };
  state.showPanel = true;
}

function onShopSelected(dto: OperatorDTO) {
  state.currentOperator = dto;
  state.showPanel = true;
}

async function onSaveOperator(dto: CreateOrUpdateOperatorDTO): Promise<void> {
  state.isSaving = true;

  await oops(
    async () => {
      if (state.currentOperator?.id) {
        // Save existing
        const operator = client.operators.wrapDTO(state.currentOperator);
        operator.active = dto.active;
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
        const newOperator = await client.operators.createOperator(dto);
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
    const params: SearchOperatorsParams = {
      ...searchParams,
      skip: operators.results.operators.length,
    };
    const results = await client.operators.searchOperators(params);
    operators.results.operators.push(
      ...results.operators.map((op) => op.toJSON()),
    );
    operators.results.totalCount = results.totalCount;
  });

  state.isLoadingMore = false;
}

function onVerificationRequested(): void {
  if (state.currentOperator) {
    state.currentOperator.verificationStatus = VerificationStatus.Pending;
    state.currentOperator.verificationMessage = undefined;
  }
}

function onVerified(message?: string): void {
  if (state.currentOperator) {
    state.currentOperator.verificationStatus = VerificationStatus.Verified;
    state.currentOperator.verificationMessage = message;
  }
}

function onVerificationRejected(message?: string): void {
  if (state.currentOperator) {
    state.currentOperator.verificationStatus = VerificationStatus.Rejected;
    state.currentOperator.verificationMessage = message;
  }
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

    const operator = client.operators.wrapDTO(state.currentOperator);
    await operator.delete();

    toasts.toast({
      id: 'operator-deleted',
      message: 'Dive shop has been deleted.',
      type: ToastType.Success,
    });

    const index = operators.results.operators.findIndex(
      (op) => op.id === state.currentOperator?.id,
    );
    if (index > -1) {
      operators.results.operators.splice(index, 1);
      operators.results.totalCount--;
    }

    state.showPanel = false;
    state.currentOperator = undefined;
    state.showConfirmDelete = false;
  });

  state.isDeleting = false;
}

function onLogoChanged(url?: string) {
  if (operators.currentOperator) {
    operators.currentOperator.logo = url;
  }
}
</script>
