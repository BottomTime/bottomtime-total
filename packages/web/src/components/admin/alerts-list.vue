<template>
  <FormBox class="flex place-items-baseline">
    <span class="grow">
      Showing <strong>{{ alerts.alerts.length }}</strong> of
      <strong>{{ alerts.totalCount }}</strong> alerts
    </span>

    <a href="/admin/alerts/new">
      <FormButton type="primary">Create New Alert</FormButton>
    </a>
  </FormBox>

  <ul>
    <li v-for="alert in alerts.alerts" :key="alert.id" class="space-y-3">
      <AlertsListItem :alert="alert" />
    </li>
  </ul>
  <div>No alerts found</div>
  <div>Other stuff</div>
</template>

<script lang="ts" setup>
import { ListAlertsResponseDTO } from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import AlertsListItem from './alerts-list-item.vue';

interface AlertsListProps {
  alerts: ListAlertsResponseDTO;
}

defineProps<AlertsListProps>();
</script>
