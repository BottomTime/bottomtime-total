<template>
  <div v-if="diveOperatorsEnabled.value">
    <PageTitle title="Dive Shops" />
    <BreadCrumbs :items="Breadcrumbs" />
    <DiveOperatorsList :operators="operators.results" />
  </div>

  <NotFound v-else />
</template>

<script lang="ts" setup>
import { ManageDiveOperatorsFeature } from '@bottomtime/common';

import { computed, onServerPrefetch } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import DiveOperatorsList from '../components/operators/dive-operators-list.vue';
import { useFeatureToggle } from '../featrues';
import { useOops } from '../oops';
import { useDiveOperators } from '../store';

const Breadcrumbs: Breadcrumb[] = [
  { label: 'Dive Shops', to: '/shops', active: true },
] as const;

const diveOperatorsEnabled = useFeatureToggle(ManageDiveOperatorsFeature);
const client = useClient();
const oops = useOops();
const operators = useDiveOperators();
const route = useRoute();

const username = computed<string | null>(() => {
  if (route.params.username) {
    return typeof route.params.username === 'string'
      ? route.params.username
      : route.params.username[0];
  }

  return null;
});

async function search(): Promise<void> {
  await oops(async () => {
    const results = await client.diveOperators.searchDiveOperators({
      owner: username.value ?? undefined,
    });

    operators.results.operators = results.operators;
    operators.results.totalCount = results.totalCount;
  });
}

onServerPrefetch(async () => {
  await search();
});
</script>
