<template>
  <ConfirmDialog
    :visible="showConfirmDeleteDialog"
    confirm-text="Delete"
    title="Delete Alert?"
    icon="fa-solid fa-circle-question fa-2xl"
    :dangerous="true"
    @confirm="onConfirmDelete"
    @cancel="onCancelDelete"
  >
    <p>
      Are you sure you want to delete the alert
      <span class="font-bold">{{ selectedAlert?.title }}</span>
      ? This action cannot be undone.
    </p>
  </ConfirmDialog>

  <FormBox class="flex place-items-baseline">
    <p class="grow" data-testid="alerts-count">
      Showing <span class="font-bold">{{ alerts.data.length }}</span> of
      <span class="font-bold">{{ alerts.totalCount }}</span> alerts
    </p>

    <a href="/admin/alerts/new">
      <FormButton type="primary">Create New Alert</FormButton>
    </a>
  </FormBox>

  <p
    v-if="alerts.data.length === 0"
    class="my-6 text-center text-lg italic space-x-3"
    data-testid="alerts-list-empty"
  >
    <span>
      <i class="fa-solid fa-info-circle"></i>
    </span>
    <span>
      No alerts found. Click
      <RouterLink to="/admin/alerts/new">here</RouterLink> to create one.
    </span>
  </p>

  <ul v-else data-testid="alerts-list">
    <li v-for="alert in alerts.data" :key="alert.id" class="space-y-3">
      <AlertsListItem :alert="alert" @delete="onDelete" />
    </li>
    <li v-if="isLoadingMore">
      <p
        class="text-center text-lg italic space-x-3"
        data-testid="loading-more-alerts"
      >
        <span>
          <i class="fa-solid fa-spinner fa-spin"></i>
        </span>
        <span>Loading...</span>
      </p>
    </li>
    <li v-else-if="alerts.data.length < alerts.totalCount" class="text-center">
      <FormButton
        size="lg"
        type="link"
        test-id="btn-load-more"
        @click="$emit('load-more')"
      >
        Load More...
      </FormButton>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { AlertDTO, ApiList } from '@bottomtime/api';

import { ref } from 'vue';
import { RouterLink } from 'vue-router';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import AlertsListItem from './alerts-list-item.vue';

interface AlertsListProps {
  alerts: ApiList<AlertDTO>;
  isLoadingMore?: boolean;
}

withDefaults(defineProps<AlertsListProps>(), {
  isLoadingMore: false,
});
const emit = defineEmits<{
  (e: 'delete', alert: AlertDTO): void;
  (e: 'load-more'): void;
}>();

const showConfirmDeleteDialog = ref(false);
const selectedAlert = ref<AlertDTO | null>(null);

function onDelete(alert: AlertDTO) {
  selectedAlert.value = alert;
  showConfirmDeleteDialog.value = true;
}

async function onConfirmDelete(): Promise<void> {
  if (selectedAlert.value) {
    emit('delete', selectedAlert.value);
    selectedAlert.value = null;
  }
  showConfirmDeleteDialog.value = false;
}

function onCancelDelete() {
  showConfirmDeleteDialog.value = false;
}
</script>
