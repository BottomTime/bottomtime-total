<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="breadcrumbs" />
  <EditDiveSite
    v-if="diveSites.currentSite && canEdit"
    :site="diveSites.currentSite"
    @site-updated="onSiteUpdated"
  />
  <ViewDiveSite
    v-else-if="diveSites.currentSite"
    :site="diveSites.currentSite"
  />
  <NotFound v-else />
</template>

<script setup lang="ts">
import { DiveSiteDTO, UserRole } from '@bottomtime/api';

import { computed, onServerPrefetch } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import EditDiveSite from '../components/diveSites/edit-dive-site.vue';
import ViewDiveSite from '../components/diveSites/view-dive-site.vue';
import { useOops } from '../oops';
import { useCurrentUser, useDiveSites } from '../store';

const client = useClient();
const currentUser = useCurrentUser();
const diveSites = useDiveSites();
const oops = useOops();
const route = useRoute();

const title = computed(() => diveSites.currentSite?.name || 'Dive Site');
const canEdit = computed(() => {
  if (!currentUser.user) return false;

  if (currentUser.user.role === UserRole.Admin) return true;

  return currentUser.user.id === diveSites.currentSite?.creator.userId;
});

const breadcrumbs: Breadcrumb[] = [
  { label: 'Dive Sites', to: '/diveSites' },
  { label: title, active: true },
];

onServerPrefetch(async () => {
  await oops(
    async () => {
      const siteId =
        typeof route.params.siteId === 'string'
          ? route.params.siteId
          : route.params.siteId[0];
      const result = await client.diveSites.getDiveSite(siteId);
      diveSites.currentSite = result.toJSON();
    },
    {
      404: () => {
        diveSites.currentSite = null;
      },
    },
  );
});

function onSiteUpdated(updated: DiveSiteDTO) {
  diveSites.currentSite = updated;
}
</script>
