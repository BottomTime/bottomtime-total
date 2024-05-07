<template>
  <PageTitle title="New Log Entry" />
  <BreadCrumbs :items="Breadcrumbs" />

  <RequireAuth>
    <EditLogbookEntry
      :entry="state.entry"
      :is-saving="state.isSaving"
      @save="onSave"
    />
  </RequireAuth>
</template>

<script lang="ts" setup>
import { LogBookSharing, LogEntryDTO } from '@bottomtime/api';

import { reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import EditLogbookEntry from '../components/logbook/edit-logbook-entry.vue';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

interface NewLogEntryViewState {
  entry: LogEntryDTO;
  isSaving: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
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
  entry: {
    creator: currentUser.user?.profile ?? {
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

async function onSave(data: LogEntryDTO): Promise<void> {
  state.isSaving = true;
  await oops(async () => {
    if (!currentUser.user) return;

    const entry = await client.logEntries.createLogEntry(
      currentUser.user.username,
      data,
    );

    location.assign(`/logbook/${currentUser.user.username}/${entry.id}`);
  });

  state.isSaving = false;
}
</script>
