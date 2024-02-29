<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="breadcrumbs" />
  <EditDiveSite
    v-if="site && canEdit"
    :site="site"
    @site-updated="onSiteUpdated"
  />
  <ViewDiveSite v-else-if="site" :site="site" />
  <NotFound v-else />
</template>

<script setup lang="ts">
import { DiveSiteDTO, UserRole } from '@bottomtime/api';

import { computed, onServerPrefetch, ref, useSSRContext } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../client';
import { AppInitialState, Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import EditDiveSite from '../components/diveSites/edit-dive-site.vue';
import ViewDiveSite from '../components/diveSites/view-dive-site.vue';
import { Config } from '../config';
import { useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();
const route = useRoute();

const site = ref<DiveSiteDTO | null>(
  Config.isSSR ? null : initialState?.currentDiveSite ?? null,
);
const title = computed(() => site.value?.name || 'Dive Site');
const canEdit = computed(() => {
  if (!currentUser.user) return false;

  if (currentUser.user.role === UserRole.Admin) return true;

  return currentUser.user.id === site.value?.creator.userId;
});

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

function onSiteUpdated(updated: DiveSiteDTO) {
  site.value = updated;
}
</script>
