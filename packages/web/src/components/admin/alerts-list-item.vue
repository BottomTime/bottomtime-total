<template>
  <div class="flex space-x-4 p-4">
    <span class="mt-1.5">
      <i class="fa-solid fa-circle-chevron-right"></i>
    </span>

    <div class="grow space-y-2">
      <p class="text-xl font-title capitalize">
        <NavLink :to="`/admin/alerts/${alert.id}`">
          {{ alert.title }}
        </NavLink>
      </p>
      <div class="flex space-x-12">
        <p class="space-x-4">
          <label class="font-bold">Active:</label>
          <span>{{ formatTimestamp(alert.active, 'always active') }}</span>
        </p>
        <p class="flex space-x-4">
          <label class="font-bold">Exires:</label>
          <span>{{ formatTimestamp(alert.expires, 'no expiration') }}</span>
        </p>
      </div>
    </div>

    <div>
      <div class="inline-flex rounded-md" role="group">
        <a :href="`/admin/alerts/${alert.id}`">
          <FormButton
            rounded="start"
            :test-id="`btn-edit-alert-${alert.id}`"
            @click="$emit('edit', alert)"
          >
            <span>
              <i class="fas fa-edit"></i>
            </span>
            <span class="sr-only">Edit Alert: {{ alert.title }}</span>
          </FormButton>
        </a>
        <FormButton
          type="danger"
          rounded="end"
          :test-id="`btn-delete-alert-${alert.id}`"
          @click="$emit('delete', alert)"
        >
          <span>
            <i class="fas fa-trash"></i>
          </span>
          <span class="sr-only">Delete Alert: {{ alert.title }}</span>
        </FormButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO } from '@bottomtime/api';

import dayjs from 'src/dayjs';

import FormButton from '../common/form-button.vue';
import NavLink from '../common/nav-link.vue';

interface AlertsListItemProps {
  alert: AlertDTO;
}

defineProps<AlertsListItemProps>();
defineEmits<{
  (e: 'delete', alert: AlertDTO): void;
  (e: 'edit', alert: AlertDTO): void;
}>();

function formatTimestamp(
  timestamp: number | undefined,
  defaultText: string,
): string {
  return timestamp ? dayjs(timestamp).format('LLL') : defaultText;
}
</script>
