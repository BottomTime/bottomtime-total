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
      v-if="state.currentProfile"
      :entry="state.entry"
      :is-saving="state.isSaving"
      @save="onSave"
    />

    <NotFound v-else />
  </RequireAuth>
</template>

<script lang="ts" setup>
import {
  LogBookSharing,
  LogEntryDTO,
  ProfileDTO,
  UserRole,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, useSSRContext } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import EditLogbookEntry from '../components/logbook/edit-logbook-entry.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

interface NewLogEntryViewState {
  currentProfile?: ProfileDTO;
  entry: LogEntryDTO;
  isSaving: boolean;
}

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : undefined;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const location = useLocation();
const oops = useOops();
const route = useRoute();

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
  currentProfile: initialState?.currentProfile,
  entry: {
    creator: initialState?.currentProfile ?? {
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
  let profile: ProfileDTO | undefined;

  await oops(
    async () => {
      if (!currentUser.user) return;
      profile = await client.users.getProfile(route.params.username as string);
    },
    {
      [404]: () => {
        profile = undefined;
      },
    },
  );

  state.currentProfile = profile;
  if (ctx) ctx.currentProfile = profile;
});

async function onSave(data: LogEntryDTO): Promise<void> {
  state.isSaving = true;
  await oops(async () => {
    if (!state.currentProfile) return;

    const entry = await client.logEntries.createLogEntry(
      state.currentProfile.username,
      {
        ...data,
        site: data.site?.id,
      },
    );

    location.assign(`/logbook/${state.currentProfile.username}/${entry.id}`);
  });

  state.isSaving = false;
}
</script>
