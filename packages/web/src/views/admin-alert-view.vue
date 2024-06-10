<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="Breadcrumbs" />

  <div class="grid grid-cols-1 xl:grid-cols-5">
    <div class="xl:col-start-2 xl:col-span-3">
      <RequireAuth :role="UserRole.Admin">
        <FormBox v-if="alerts.currentAlert">
          <EditAlert :alert="alerts.currentAlert" @save="onSaveAlert" />
        </FormBox>
        <NotFound v-else />
      </RequireAuth>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO, UserRole } from '@bottomtime/api';

import { computed, onServerPrefetch } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import EditAlert from '../components/admin/edit-alert.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import FormBox from '../components/common/form-box.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useAlerts, useToasts } from '../store';

const alerts = useAlerts();
const client = useClient();
const location = useLocation();
const oops = useOops();
const route = useRoute();
const toasts = useToasts();

const title = computed(() =>
  alerts.currentAlert ? alerts.currentAlert.title || 'New Alert' : 'Edit Alert',
);
const Breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Alerts', to: '/admin/alerts' },
  { label: title, active: true },
];

async function onSaveAlert(updated: AlertDTO) {
  await oops(async () => {
    if (alerts.currentAlert?.id) {
      // Alert already exists, update it.
      const alert = client.alerts.wrapDTO(updated);
      await alert.save();
      toasts.toast({
        id: 'alert-saved',
        message: 'Alert successfully saved',
        type: ToastType.Success,
      });
      alerts.currentAlert = updated;
    } else {
      // Alert is new, create it.
      const result = await client.alerts.createAlert(updated);
      alerts.currentAlert = updated;
      location.assign(`/admin/alerts/${result.id}`);
    }
  });
}

onServerPrefetch(async () => {
  const alertId = route.params.alertId;
  if (typeof alertId !== 'string' || !alertId) {
    // No Alert ID in the URL!
    // This means we are creating a new alert from scratch.
    // Proceed without requesting information from the backend.
    alerts.currentAlert = {
      icon: '',
      title: '',
      message: '',
      id: '',
    };
    return;
  }

  await oops(
    async () => {
      const result = await client.alerts.getAlert(alertId);
      alerts.currentAlert = result.toJSON();
    },
    {
      404: () => {
        alerts.currentAlert = null;
      },
    },
  );
});
</script>
