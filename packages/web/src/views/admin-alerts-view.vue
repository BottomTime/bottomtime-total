<template>
  <PageTitle title="Manage Alerts" />
  <BreadCrumbs :items="Breadcrumbs" />

  <AlertsList :alerts="data" />
</template>

<script lang="ts" setup>
import { ListAlertsResponseDTO } from '@bottomtime/api';

import { onMounted, onServerPrefetch, reactive, useSSRContext } from 'vue';

import { useClient } from '../client';
import { Breadcrumb } from '../common';
import AlertsList from '../components/admin/alerts-list.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const initialState = useInitialState();
const oops = useOops();

const data = reactive<ListAlertsResponseDTO>(
  initialState?.alerts ?? {
    alerts: [],
    totalCount: 0,
  },
);

const Breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Manage Alerts', active: true },
];

onMounted(async () => {
  await oops(async () => {
    const { alerts, totalCount } = await client.alerts.listAlerts({
      showDismissed: true,
    });
    data.alerts = alerts.map((alert) => alert.toJSON());
    data.totalCount = totalCount;
  });

  if (ctx) ctx.alerts = data;
});
</script>
