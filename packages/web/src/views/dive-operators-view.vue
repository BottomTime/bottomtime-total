<template>
  <div v-if="diveOperatorsEnabled.value">
    <PageTitle title="My Dive Shops" />
    <DiveOperatorsList :operators="operators.results" />
  </div>

  <NotFound v-else />
</template>

<script lang="ts" setup>
import { ManageDiveOperatorsFeature } from '@bottomtime/common';

import { onServerPrefetch } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import DiveOperatorsList from '../components/operators/dive-operators-list.vue';
import { useFeatureToggle } from '../featrues';
import { useOops } from '../oops';
import { useDiveOperators } from '../store';

const diveOperatorsEnabled = useFeatureToggle(ManageDiveOperatorsFeature);
const client = useClient();
const oops = useOops();
const operators = useDiveOperators();
const route = useRoute();

async function search(): Promise<void> {
  const username =
    typeof route.params.username === 'string'
      ? route.params.username
      : route.params.username[0];

  await oops(async () => {
    const results = await client.diveOperators.searchDiveOperators({
      // owner: username,
    });

    operators.results.operators = results.operators;
    operators.results.totalCount = results.totalCount;
  });
}

onServerPrefetch(async () => {
  await search();
});
</script>
