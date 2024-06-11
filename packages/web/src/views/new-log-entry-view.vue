<template>
  <PageTitle title="New Log Entry" />
  <BreadCrumbs :items="Breadcrumbs" />

  <RequireAuth
    :auth-check="
      (user) =>
        user.role === UserRole.Admin || user.username === $route.params.username
    "
  >
    <EditLogbookEntry
      v-if="profiles.currentProfile"
      :entry="state.entry"
      :is-saving="state.isSaving"
      :tanks="tanks.results.tanks"
      @save="onSave"
    />

    <NotFound v-else />
  </RequireAuth>
</template>

<script lang="ts" setup>
import { LogBookSharing, LogEntryDTO, UserRole } from '@bottomtime/api';

import { onServerPrefetch, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import EditLogbookEntry from '../components/logbook/edit-logbook-entry.vue';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useCurrentUser, useProfiles, useTanks } from '../store';

interface NewLogEntryViewState {
  entry: LogEntryDTO;
  isSaving: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
const location = useLocation();
const oops = useOops();
const profiles = useProfiles();
const route = useRoute();
const tanks = useTanks();

const Breadcrumbs: Breadcrumb[] = [
  {
    label: 'Logbook',
    to:
      typeof route.params.username === 'string'
        ? `/logbook/${route.params.username}`
        : '/logbook',
  },
  { label: 'New Log Entry', active: true },
];

const state = reactive<NewLogEntryViewState>({
  entry: {
    creator: profiles.currentProfile ?? {
      logBookSharing: LogBookSharing.Private,
      memberSince: new Date(),
      userId: '',
      username: '',
    },
    duration: -1,
    entryTime: {
      date: '',
      timezone: '',
    },
    id: '',
  },
  isSaving: false,
});

onServerPrefetch(async () => {
  await Promise.all([
    oops(
      async () => {
        if (!currentUser.user) return;
        profiles.currentProfile = await client.users.getProfile(
          route.params.username as string,
        );
      },
      {
        [404]: () => {
          profiles.currentProfile = null;
        },
      },
    ),
    oops(async () => {
      if (!currentUser.user) return;
      const tankResults = await client.tanks.listTanks({
        username: route.params.username as string,
        includeSystem: true,
      });
      tanks.results.tanks = tankResults.tanks.map((tank) => tank.toJSON());
      tanks.results.totalCount = tankResults.totalCount;
    }),
  ]);
});

async function onSave(data: LogEntryDTO): Promise<void> {
  state.isSaving = true;
  await oops(async () => {
    if (!profiles.currentProfile) return;

    const entry = await client.logEntries.createLogEntry(
      profiles.currentProfile.username,
      {
        ...data,
        site: data.site?.id,
      },
    );

    location.assign(`/logbook/${profiles.currentProfile.username}/${entry.id}`);
  });

  state.isSaving = false;
}
</script>
