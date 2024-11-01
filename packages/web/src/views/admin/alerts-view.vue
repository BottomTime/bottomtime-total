<template>
  <PageTitle title="Manage Alerts" />
  <BreadCrumbs :items="Breadcrumbs" />

  <RequireAuth :role="UserRole.Admin">
    <AlertsList
      :alerts="alerts.results"
      :is-loading-more="isLoadingMore"
      @load-more="onLoadMore"
      @delete="onDeleteAlert"
    />
  </RequireAuth>
</template>

<script lang="ts" setup>
import { AlertDTO, UserRole } from '@bottomtime/api';

import { onMounted, ref } from 'vue';

import { useClient } from '../../api-client';
import { Breadcrumb, ToastType } from '../../common';
import AlertsList from '../../components/admin/alerts-list.vue';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth.vue';
import { useOops } from '../../oops';
import { useAlerts, useToasts } from '../../store';

const alerts = useAlerts();
const client = useClient();
const oops = useOops();
const toasts = useToasts();

const isLoadingMore = ref(false);

const Breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Manage Alerts', active: true },
];

onMounted(async () => {
  await oops(async () => {
    const { alerts: results, totalCount } = await client.alerts.listAlerts({
      showDismissed: true,
    });
    alerts.results.alerts = results.map((alert) => alert.toJSON());
    alerts.results.totalCount = totalCount;
  });
});

async function onDeleteAlert(dto: AlertDTO): Promise<void> {
  await oops(async () => {
    const alert = client.alerts.wrapDTO(dto);
    await alert.delete();

    const index = alerts.results.alerts.findIndex((a) => a.id === alert.id);
    if (index >= 0) {
      alerts.results.alerts.splice(index, 1);
      alerts.results.totalCount--;

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
      skip: alerts.results.alerts.length,
    });

    alerts.results.totalCount = results.totalCount;
    alerts.results.alerts.push(...results.alerts.map((a) => a.toJSON()));
  });
  isLoadingMore.value = false;
}
</script>
