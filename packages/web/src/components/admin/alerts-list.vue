<template>
  <ConfirmDialog
    :visible="showConfirmDeleteDialog"
    confirm-text="Delete"
    title="Delete Alert?"
    :dangerous="true"
    @confirm="onConfirmDelete"
    @cancel="onCancelDelete"
  >
    <div class="flex space-x-4">
      <span class="mt-2">
        <i class="fa-solid fa-circle-question fa-2xl"></i>
      </span>
      <div>
        <p>
          Are you sure you want to delete the alert
          <span class="font-bold">{{ selectedAlert?.title }}</span>
          ? This action cannot be undone.
        </p>
      </div>
    </div>
  </ConfirmDialog>

  <FormBox class="flex place-items-baseline">
    <p class="grow">
      Showing <span class="font-bold">{{ alerts.alerts.length }}</span> of
      <span class="font-bold">{{ alerts.totalCount }}</span> alerts
    </p>

    <a href="/admin/alerts/new">
      <FormButton type="primary">Create New Alert</FormButton>
    </a>
  </FormBox>

  <ul>
    <li v-for="alert in alerts.alerts" :key="alert.id" class="space-y-3">
      <AlertsListItem :alert="alert" @delete="onDelete" />
    </li>
    <li v-if="isLoadingMore">
      <p class="text-center text-lg italic space-x-3">
        <span>
          <i class="fa-solid fa-spinner fa-spin"></i>
        </span>
        <span>Loading...</span>
      </p>
    </li>
    <li
      v-else-if="alerts.alerts.length < alerts.totalCount"
      class="text-center"
    >
      <FormButton size="lg" type="link">Load More...</FormButton>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { AlertDTO, ListAlertsResponseDTO } from '@bottomtime/api';

import { ref } from 'vue';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import AlertsListItem from './alerts-list-item.vue';

interface AlertsListProps {
  alerts: ListAlertsResponseDTO;
}

defineProps<AlertsListProps>();
const emit = defineEmits<{
  (e: 'delete', alert: AlertDTO): void;
}>();

const showConfirmDeleteDialog = ref(false);
const selectedAlert = ref<AlertDTO | null>(null);
const isLoadingMore = ref(false);

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
