<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="items" />

  <div v-if="state.entry">
    <EditLogbookEntry
      v-if="editMode"
      :entry="state.entry"
      :is-saving="state.isSaving"
      @save="onSave"
    />
    <ViewLogbookEntry v-else :entry="state.entry" />
  </div>
  <NotFound v-else />
</template>

<script lang="ts" setup>
import { LogEntryDTO, UserRole } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed, onServerPrefetch, reactive, useSSRContext } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import EditLogbookEntry from '../components/logbook/edit-logbook-entry.vue';
import ViewLogbookEntry from '../components/logbook/view-logbook-entry.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useCurrentUser, useToasts } from '../store';

interface LogEntryViewState {
  entry?: LogEntryDTO;
  isSaving: boolean;
}

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : undefined;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();
const route = useRoute();
const toasts = useToasts();

const state = reactive<LogEntryViewState>({
  entry: initialState?.currentLogEntry,
  isSaving: false,
});

const title = computed(() =>
  state.entry ? dayjs(state.entry.entryTime.date).format('LLL') : 'Log Entry',
);
const logbookPath = computed(() =>
  typeof route.params.username === 'string'
    ? `/logbook/${route.params.username}`
    : '/logbook',
);
const editMode = computed(() => {
  if (!currentUser.user) return false;
  else if (currentUser.user.role === UserRole.Admin) return true;
  else return route.params.username === currentUser.user.username;
});

const items: Breadcrumb[] = [
  { label: 'Logbook', to: logbookPath },
  { label: title, active: true },
];

onServerPrefetch(async () => {
  await oops(
    async () => {
      if (
        typeof route.params.entryId !== 'string' ||
        typeof route.params.username !== 'string'
      ) {
        return;
      }

      const entry = await client.logEntries.getLogEntry(
        route.params.username,
        route.params.entryId,
      );

      state.entry = entry.toJSON();
    },
    {
      [403]: () => {
        state.entry = undefined;
      },
      [404]: () => {
        state.entry = undefined;
      },
    },
  );

  if (ctx) ctx.currentLogEntry = state.entry;
});

async function onSave(data: LogEntryDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    const entry = client.logEntries.wrapDTO(data);
    await entry.save();
    toasts.toast({
      id: 'log-entry-saved',
      message: 'Log entry has been successfully saved',
      type: ToastType.Success,
    });
  });

  state.isSaving = false;
}
</script>
