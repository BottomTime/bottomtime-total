<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="breadcrumbs" />

  <RequireAuth :authorizer="isAuthorized">
    <div v-if="state.isLoading" class="flex justify-center text-xl my-8">
      <LoadingSpinner message="Fetching dive site info..." />
    </div>

    <template v-else-if="state.currentSite">
      <EditDiveSite
        v-if="canEdit"
        :site="state.currentSite"
        @site-updated="onSiteUpdated"
      />
      <ViewDiveSite v-else :site="state.currentSite" />
    </template>

    <NotFound v-else />
  </RequireAuth>
</template>

<script setup lang="ts">
import {
  AccountTier,
  DiveSiteDTO,
  LogBookSharing,
  UserRole,
} from '@bottomtime/api';

import RequireAuth from '@/components/common/require-auth2.vue';

import { computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import EditDiveSite from '../../components/diveSites/edit-dive-site.vue';
import ViewDiveSite from '../../components/diveSites/view-dive-site.vue';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';

interface DiveSiteViewState {
  isLoading: boolean;
  currentSite?: DiveSiteDTO;
}

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();

const siteId = computed<string | undefined>(() => {
  if (!route.params.siteId) return undefined;

  return typeof route.params.siteId === 'string'
    ? route.params.siteId
    : route.params.siteId[0];
});
const state = reactive<DiveSiteViewState>({
  isLoading: true,
});
const title = computed(() => state.currentSite?.name || 'Dive Site');
const canEdit = computed(() => {
  if (!currentUser.user) return false;

  if (currentUser.user.role === UserRole.Admin) return true;

  return currentUser.user.id === state.currentSite?.creator.userId;
});
const isAuthorized = computed(() => {
  // Any user can view dive sites (even if in read-only mode).
  if (siteId.value) return true;

  // For creating new dive sites, users must be logged in.
  return !currentUser.anonymous;
});

const breadcrumbs: Breadcrumb[] = [
  { label: 'Dive Sites', to: '/diveSites' },
  { label: title, active: true },
];

onMounted(async () => {
  await oops(
    async () => {
      if (!siteId.value) {
        state.currentSite = {
          createdOn: new Date(),
          creator: currentUser.user?.profile ?? {
            accountTier: AccountTier.Basic,
            userId: '',
            logBookSharing: LogBookSharing.Private,
            memberSince: new Date(),
            username: '',
          },
          id: '',
          location: '',
          name: '',
        };
        return;
      }

      const result = await client.diveSites.getDiveSite(siteId.value);
      state.currentSite = result.toJSON();
    },
    {
      404: () => {
        state.currentSite = undefined;
      },
    },
  );

  state.isLoading = false;
});

function onSiteUpdated(updated: DiveSiteDTO) {
  state.currentSite = updated;
}
</script>
