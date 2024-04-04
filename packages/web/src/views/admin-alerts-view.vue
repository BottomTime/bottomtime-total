<template>
  <PageTitle title="Manage Alerts" />
  <BreadCrumbs :items="Breadcrumbs" />

  <RequireAuth :role="UserRole.Admin">
    <AlertsList
      :alerts="data"
      :is-loading-more="isLoadingMore"
      @load-more="onLoadMore"
      @delete="onDeleteAlert"
    />
  </RequireAuth>
</template>

<script lang="ts" setup>
import {
  AlertDTO,
  ListAlertsResponseDTO,
  ListAlertsResponseSchema,
  UserRole,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, ref, useSSRContext } from 'vue';

import { useClient } from '../../src/api-client';
import { Breadcrumb, ToastType } from '../common';
import AlertsList from '../components/admin/alerts-list.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useToasts } from '../store';

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : undefined;
const initialState = useInitialState();
const oops = useOops();
const toasts = useToasts();

const data = reactive<ListAlertsResponseDTO>(
  initialState?.alerts
    ? ListAlertsResponseSchema.parse(initialState.alerts)
    : {
        alerts: [],
        totalCount: 0,
      },
);
const isLoadingMore = ref(false);

const Breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Manage Alerts', active: true },
];

onServerPrefetch(async () => {
  await oops(async () => {
    const { alerts, totalCount } = await client.alerts.listAlerts({
      showDismissed: true,
    });
    data.alerts = alerts.map((alert) => alert.toJSON());
    data.totalCount = totalCount;
  });

  if (ctx) ctx.alerts = data;
});

async function onDeleteAlert(dto: AlertDTO): Promise<void> {
  await oops(async () => {
    const alert = client.alerts.wrapDTO(dto);
    await alert.delete();

    const index = data.alerts.findIndex((a) => a.id === alert.id);
    if (index >= 0) {
      data.alerts.splice(index, 1);
      data.totalCount--;

      toasts.toast({
        id: 'alert-deleted',
        message: 'Alert was successfully deleted',
        type: ToastType.Success,
      });
    }
  });
}

async function onLoadMore(): Promise<void> {
  isLoadingMore.value = true;
  await oops(async () => {
    const results = await client.alerts.listAlerts({
      showDismissed: true,
      skip: data.alerts.length,
    });

    data.totalCount = results.totalCount;
    data.alerts.push(...results.alerts.map((a) => a.toJSON()));
  });
  isLoadingMore.value = false;
}
</script>
