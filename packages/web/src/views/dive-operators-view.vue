<template>
  <PageTitle title="Dive Operators" />

  <DiveOperatorsList :operators="operators.results" />
</template>

<script lang="ts" setup>
import { onServerPrefetch } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import PageTitle from '../components/common/page-title.vue';
import DiveOperatorsList from '../components/operators/dive-operators-list.vue';
import { useOops } from '../oops';
import { useDiveOperators } from '../store';

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
