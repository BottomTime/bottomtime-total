<template>
  <PageTitle title="Manage Alerts" />
  <BreadCrumbs :items="Breadcrumbs" />

  <AlertsList :alerts="data" @delete="onDeleteAlert" />
</template>

<script lang="ts" setup>
import {
  AlertDTO,
  ListAlertsResponseDTO,
  ListAlertsResponseSchema,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, useSSRContext } from 'vue';

import { useClient } from '../client';
import { Breadcrumb, ToastType } from '../common';
import AlertsList from '../components/admin/alerts-list.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useToasts } from '../store';

const client = useClient();
const ctx = useSSRContext<AppInitialState>();
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
    }

    toasts.toast({
      id: 'alert-deleted',
      message: 'Alert was successfully deleted',
      type: ToastType.Success,
    });
  });
}
</script>
