<template>
  <div>{{ operators.results }}</div>
  <DiveOperatorsList :operators="operators.results" />
</template>

<script lang="ts" setup>
import { VerificationStatus } from '@bottomtime/api';

import { onServerPrefetch } from 'vue';

import { useClient } from '../api-client';
import DiveOperatorsList from '../components/operators/dive-operators-list.vue';
import { useOops } from '../oops';
import { useDiveOperators } from '../store';

const client = useClient();
const oops = useOops();
const operators = useDiveOperators();

onServerPrefetch(async () => {
  await oops(async () => {
    const results = await client.diveOperators.searchDiveOperators({
      verification: VerificationStatus.Pending,
    });

    operators.results.operators = results.operators.map((op) => op.toJSON());
    operators.results.totalCount = results.totalCount;
  });
});
</script>
