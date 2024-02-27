<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="breadcrumbs" />
  <ViewDiveSite v-if="site" :site="site" />
  <NotFound v-else />
</template>

<script setup lang="ts">
import { DiveSiteDTO } from '@bottomtime/api';

import { computed, onServerPrefetch, ref, useSSRContext } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../client';
import { AppInitialState, Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import ViewDiveSite from '../components/diveSites/view-dive-site.vue';
import { Config } from '../config';
import { useInitialState } from '../initial-state';
import { useOops } from '../oops';

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const initialState = useInitialState();
const oops = useOops();
const route = useRoute();

const site = ref<DiveSiteDTO | null>(
  Config.isSSR ? null : initialState?.currentDiveSite ?? null,
);
const title = computed(() => site.value?.name || 'Dive Site');

const breadcrumbs: Breadcrumb[] = [
  { label: 'Dive Sites', to: '/diveSites' },
  { label: () => title.value, active: true },
];

onServerPrefetch(async () => {
  await oops(
    async () => {
      const siteId =
        typeof route.params.siteId === 'string'
          ? route.params.siteId
          : route.params.siteId[0];
      const result = await client.diveSites.getDiveSite(siteId);
      site.value = result.toJSON();
    },
    {
      404: () => {
        site.value = null;
      },
    },
  );

  if (ctx) ctx.currentDiveSite = site.value;
});
</script>
