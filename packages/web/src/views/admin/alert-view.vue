<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="Breadcrumbs" />

  <div class="grid grid-cols-1 xl:grid-cols-5">
    <div class="xl:col-start-2 xl:col-span-3">
      <RequireAuth :authorizer="isAuthorized">
        <FormBox v-if="state.currentAlert">
          <div v-if="state.isLoading" class="flex justify-center my-8 text-xl">
            <LoadingSpinner message="Fetching alert info..." />
          </div>

          <EditAlert v-else :alert="state.currentAlert" @save="onSaveAlert" />
        </FormBox>
        <NotFound v-else />
      </RequireAuth>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO, UserRole } from '@bottomtime/api';

import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb, ToastType } from '../../common';
import EditAlert from '../../components/admin/edit-alert.vue';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import FormBox from '../../components/common/form-box.vue';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth2.vue';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';

interface AlertViewState {
  currentAlert?: AlertDTO;
  isLoading: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();
const router = useRouter();
const toasts = useToasts();

const state = reactive<AlertViewState>({
  isLoading: true,
});
const alertId = computed(() => {
  if (route.params.alertId) {
    return typeof route.params.alertId === 'string'
      ? route.params.alertId
      : route.params.alertId[0];
  }

  return undefined;
});
const isAuthorized = computed(() => currentUser.user?.role === UserRole.Admin);
const title = computed(() =>
  state.currentAlert ? state.currentAlert.title || 'New Alert' : 'Edit Alert',
);
const Breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Alerts', to: '/admin/alerts' },
  { label: title, active: true },
];

async function onSaveAlert(updated: AlertDTO) {
  await oops(async () => {
    if (state.currentAlert?.id) {
      // Alert already exists, update it.
      await client.alerts.updateAlert(updated);
      toasts.toast({
        id: 'alert-saved',
        message: 'Alert successfully saved',
        type: ToastType.Success,
      });
      state.currentAlert = updated;
    } else {
      // Alert is new, create it.
      const result = await client.alerts.createAlert(updated);
      state.currentAlert = updated;
      await router.push(`/admin/alerts/${result.id}`);
    }
  });
}

onMounted(async () => {
  if (isAuthorized.value) {
    await oops(
      async () => {
        if (alertId.value) {
          state.currentAlert = await client.alerts.getAlert(alertId.value);
        } else {
          state.currentAlert = {
            icon: '',
            title: '',
            message: '',
            id: '',
          };
        }
      },
      {
        404: () => {
          state.currentAlert = undefined;
        },
      },
    );
  }

  state.isLoading = false;
});
</script>
