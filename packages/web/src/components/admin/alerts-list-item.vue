<template>
  <div class="flex space-x-3 p-4">
    <span>
      <i :class="alert.icon"></i>
    </span>

    <div class="grow">
      <p class="text-xl font-title">{{ alert.title }}</p>
      <div class="flex space-x-12">
        <p class="space-x-4">
          <label class="font-bold">Active:</label>
          <span>{{ alert.active ? alert.active.toDateString() : 'wat' }}</span>
        </p>
        <p class="flex space-x-4">
          <label class="font-bold">Exires:</label>
          <span>
            {{ alert.expires ? alert.expires.toDateString() : 'no expiration' }}
          </span>
        </p>
      </div>
    </div>

    <div class="flex space-x-2">
      <FormButton>
        <span>
          <i class="fas fa-edit"></i>
        </span>
      </FormButton>
      <FormButton type="danger">
        <span>
          <i class="fas fa-trash"></i>
        </span>
      </FormButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO } from '@bottomtime/api';

import FormButton from '../common/form-button.vue';

interface AlertsListItemProps {
  alert: AlertDTO;
}

defineProps<AlertsListItemProps>();
</script>
