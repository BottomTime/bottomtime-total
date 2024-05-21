<template>
  <FormBox class="space-y-3 shadow-lg">
    <div class="text-center">
      <TextHeading>App Metrics</TextHeading>
    </div>

    <div v-if="state.isLoading" class="w-full text-center">
      <LoadingSpinner message="Loading app metrics..." />
    </div>

    <div v-else-if="state.metrics" class="flex gap-3 justify-between">
      <div class="space-y-2 text-center">
        <TextHeading level="h2">Users</TextHeading>

        <div>
          <p class="font-bold font-title">Total users</p>
          <p class="text-lg font-mono text-success">
            {{ state.metrics.users.total.toLocaleString() }}
          </p>
        </div>

        <div>
          <p class="font-bold font-title">Active users</p>
          <p class="text-lg font-mono text-success">
            {{ state.metrics.users.active.toLocaleString() }}
          </p>
        </div>

        <div>
          <p class="font-bold font-title">Active this month</p>
          <p class="text-lg font-mono text-success">
            {{ state.metrics.users.activeLastMonth.toLocaleString() }}
          </p>
        </div>
      </div>

      <div class="space-y-2 text-center">
        <TextHeading level="h2">Dives Sites</TextHeading>

        <div>
          <p class="font-bold font-title">Total sites</p>
          <p class="text-lg font-mono text-success">
            {{ state.metrics.diveSites.total.toLocaleString() }}
          </p>
        </div>
      </div>

      <div class="space-y-2 text-center">
        <TextHeading level="h2">Logged Dives</TextHeading>

        <div>
          <p class="font-bold font-title">Total logged dives</p>
          <p class="text-lg font-mono text-success">
            {{ state.metrics.logEntries.total.toLocaleString() }}
          </p>
        </div>

        <div>
          <p class="font-bold font-title">Logged this Week</p>
          <p class="text-lg font-mono text-success">
            {{ state.metrics.logEntries.addedLastWeek.toLocaleString() }}
          </p>
        </div>

        <div>
          <p class="font-bold font-title">Logged this Month</p>
          <p class="text-lg font-mono text-success">
            {{ state.metrics.logEntries.addedLastMonth.toLocaleString() }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="w-full text-center">
      <p class="space-x-3 text-danger font-bold">
        <span>
          <i class="fas fa-exclamation-triangle"></i>
        </span>
        <span>
          Failed to load app metrics due to a server error. Please try again
          later.
        </span>
      </p>
    </div>
  </FormBox>
</template>

<script lang="ts" setup>
import { AppMetricsDTO } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import { useOops } from '../../oops';
import FormBox from '../common/form-box.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import TextHeading from '../common/text-heading.vue';

interface AppMetricsState {
  isLoading: boolean;
  metrics: AppMetricsDTO | null;
}

const client = useClient();
const oops = useOops();

const state = reactive<AppMetricsState>({
  isLoading: true,
  metrics: null,
});

onMounted(async () => {
  await oops(async () => {
    state.metrics = await client.getAppMetrics();
  });
  state.isLoading = false;
});
</script>
