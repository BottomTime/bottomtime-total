<template>
  <FormBox class="flex place-items-baseline">
    <span class="grow">
      Showing <strong>{{ data.alerts.length }}</strong> of
      <strong>{{ data.totalCount }}</strong> alerts
    </span>

    <a href="/admin/alerts/new">
      <FormButton type="primary">Create New Alert</FormButton>
    </a>
  </FormBox>
  <div>Create Alert</div>
  <div>Alerts</div>
  <div>No alerts found</div>
  <div>Other stuff</div>
</template>

<script lang="ts" setup>
import { ListAlertsResponseDTO } from '@bottomtime/api';

import { onServerPrefetch, reactive } from 'vue';

import { useClient } from '../../client';
import { useOops } from '../../oops';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';

const client = useClient();
const oops = useOops();

const data = reactive<ListAlertsResponseDTO>({
  alerts: [],
  totalCount: 0,
});

onServerPrefetch(async () => {
  await oops(async () => {
    const alerts = await client.alerts.listAlerts();
  });
});
</script>
