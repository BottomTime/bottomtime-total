<template>
  <PageTitle title="Manage Alerts" />
  <BreadCrumbs :items="Breadcrumbs" />

  <RequireAuth :authorizer="isAuthorized">
    <div v-if="state.isLoading" class="flex justify-center my-8 text-xl">
      <LoadingSpinner message="Fetching alerts..." />
    </div>

    <AlertsList
      v-else
      :alerts="state.results"
      :is-loading-more="state.isLoadingMore"
      @load-more="onLoadMore"
      @delete="onDeleteAlert"
    />
  </RequireAuth>
</template>

<script lang="ts" setup>
import { AlertDTO, ListAlertsResponseDTO, UserRole } from '@bottomtime/api';

import { computed, onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import { Breadcrumb, ToastType } from '../../common';
import AlertsList from '../../components/admin/alerts-list.vue';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth2.vue';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';
import LoadingSpinner from '../components/common/loading-spinner.vue';

interface AlertsViewState {
  currentAlert?: AlertDTO;
  isLoading: boolean;
  isLoadingMore: boolean;
  results: ListAlertsResponseDTO;
}

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const toasts = useToasts();

const Breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Manage Alerts', active: true },
];

const isAuthorized = computed(() => currentUser.user?.role === UserRole.Admin);
const state = reactive<AlertsViewState>({
  isLoading: true,
  isLoadingMore: false,
  results: {
    alerts: [],
    totalCount: 0,
  },
});

onMounted(async () => {
  await oops(async () => {
    if (!isAuthorized.value) return;
    const { alerts: results, totalCount } = await client.alerts.listAlerts({
      showDismissed: true,
    });
    state.results.alerts = results.map((alert) => alert.toJSON());
    state.results.totalCount = totalCount;
  });
});

async function onDeleteAlert(dto: AlertDTO): Promise<void> {
  await oops(async () => {
    const alert = client.alerts.wrapDTO(dto);
    await alert.delete();

    const index = state.results.alerts.findIndex((a) => a.id === alert.id);
    if (index >= 0) {
      state.results.alerts.splice(index, 1);
      state.results.totalCount--;

      toasts.toast({
        id: 'alert-deleted',
        message: 'Alert was successfully deleted',
        type: ToastType.Success,
      });
    }
  });
}

async function onLoadMore(): Promise<void> {
  state.isLoadingMore = true;
  await oops(async () => {
    const results = await client.alerts.listAlerts({
      showDismissed: true,
      skip: state.results.alerts.length,
    });

    state.results.totalCount = results.totalCount;
    state.results.alerts.push(...results.alerts.map((a) => a.toJSON()));
  });
  state.isLoadingMore = false;
}
</script>
