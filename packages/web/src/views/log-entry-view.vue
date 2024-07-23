<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="items" />

  <div v-if="logEntries.currentEntry">
    <EditLogbookEntry
      v-if="editMode"
      :entry="logEntries.currentEntry"
      :is-saving="state.isSaving"
      :tanks="tanks.results.tanks"
      @save="onSave"
    />
    <ViewLogbookEntry v-else :entry="logEntries.currentEntry" />
  </div>
  <NotFound v-else />
</template>

<script lang="ts" setup>
import { LogEntryDTO, UserRole } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed, onServerPrefetch, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import EditLogbookEntry from '../components/logbook/edit-logbook-entry.vue';
import ViewLogbookEntry from '../components/logbook/view-logbook-entry.vue';
import { useOops } from '../oops';
import { useCurrentUser, useLogEntries, useTanks, useToasts } from '../store';

interface LogEntryViewState {
  isSaving: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
const logEntries = useLogEntries();
const oops = useOops();
const route = useRoute();
const tanks = useTanks();
const toasts = useToasts();

const state = reactive<LogEntryViewState>({
  isSaving: false,
});

const title = computed(() =>
  logEntries.currentEntry
    ? dayjs(logEntries.currentEntry.timing.entryTime.date).format('LLL')
    : 'Log Entry',
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
  await Promise.all([
    oops(
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

        logEntries.currentEntry = entry.toJSON();
      },
      {
        [403]: () => {
          logEntries.currentEntry = null;
        },
        [404]: () => {
          logEntries.currentEntry = null;
        },
      },
    ),
    oops(async () => {
      if (typeof route.params.username !== 'string') return;

      const tanksResult = await client.tanks.listTanks({
        username: route.params.username,
        includeSystem: true,
      });

      tanks.results.tanks = tanksResult.tanks.map((tank) => tank.toJSON());
      tanks.results.totalCount = tanksResult.totalCount;
    }),
  ]);
});

async function onSave(data: LogEntryDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    const entry = client.logEntries.wrapDTO(data);
    await entry.save();

    logEntries.currentEntry = entry.toJSON();
    toasts.toast({
      id: 'log-entry-saved',
      message: 'Log entry has been successfully saved',
      type: ToastType.Success,
    });
  });

  state.isSaving = false;
}
</script>
