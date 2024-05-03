<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="items" />

  <ViewLogbookEntry v-if="state.entry" :entry="state.entry" />
  <NotFound v-else />
</template>

<script lang="ts" setup>
import { LogEntryDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed, onServerPrefetch, reactive, useSSRContext } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import ViewLogbookEntry from '../components/logbook/view-logbook-entry.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';

interface LogEntryViewState {
  entry?: LogEntryDTO;
}

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : undefined;
const initialState = useInitialState();
const oops = useOops();
const route = useRoute();

const state = reactive<LogEntryViewState>({
  entry: initialState?.currentLogEntry,
});

const title = computed(() =>
  state.entry ? dayjs(state.entry.entryTime.date).format('LLL') : 'Log Entry',
);
const logbookPath = computed(() =>
  typeof route.params.username === 'string'
    ? `/logbook/${route.params.username}`
    : '/logbook',
);

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
</script>
