<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="Breadcrumbs" />

  <div class="grid grid-cols-1 xl:grid-cols-5">
    <FormBox v-if="alert" class="xl:col-start-2 xl:col-span-3">
      <EditAlert
        :alert="alert"
        :show-revert="typeof route.params.alertId === 'string'"
        @saved="onAlertSaved"
      />
    </FormBox>
    <NotFound v-else />
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO } from '@bottomtime/api';

import { computed, onServerPrefetch, ref, useSSRContext } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../client';
import { Breadcrumb } from '../common';
import EditAlert from '../components/admin/edit-alert.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import FormBox from '../components/common/form-box.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const initialSate = useInitialState();
const oops = useOops();
const route = useRoute();

const Breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Alerts', to: '/admin/alerts' },
  { label: () => title.value, active: true },
];

const alert = ref<AlertDTO | undefined>(
  initialSate?.currentAlert ?? {
    id: '',
    icon: '',
    title: '',
    message: '',
  },
);
const title = computed(() => alert.value?.title || 'New Alert');

function onAlertSaved(updated: AlertDTO) {
  alert.value = updated;
}

onServerPrefetch(async () => {
  const alertId = route.params.alertId as string | undefined;
  if (!alertId) {
    // No Alert ID in the URL!
    // This means we are creating a new alert from scratch.
    // Proceed without requesting information from the backend.
    return;
  }

  await oops(
    async () => {
      const result = await client.alerts.getAlert(alertId);
      alert.value = result.toJSON();
    },
    {
      404: () => {
        alert.value = undefined;
      },
    },
  );

  if (ctx) ctx.currentAlert = alert.value;
});
</script>
