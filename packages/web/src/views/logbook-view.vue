<template>
  <PageTitle title="Logbook" />
  <!-- <div>
    <p>
      <span
        >Showing {{ state.entries.logEntries.length }} of
        {{ state.entries.totalCount }} log entries</span
      >
    </p>
  </div> -->

  <div>
    {{ route.query }}
  </div>

  <!-- <ul>
    <li v-for="entry in state.entries.logEntries" :key="entry.id">
      {{ JSON.stringify(entry) }}
    </li>
  </ul> -->
</template>

<script lang="ts" setup>
import {
  ListLogEntriesParamsDTO,
  ListLogEntriesParamsSchema,
  ListLogEntriesResponseDTO,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, useSSRContext } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import PageTitle from '../components/common/page-title.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

interface LogbookViewState {
  entries: ListLogEntriesResponseDTO;
  queryParams: ListLogEntriesParamsDTO;
}

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();
const route = useRoute();

function parseQueryString(): ListLogEntriesParamsDTO {
  const parsed = ListLogEntriesParamsSchema.safeParse(route.query);
  return parsed.success
    ? {
        ...parsed.data,
        skip: 0,
      }
    : {};
}

const state = reactive<LogbookViewState>({
  queryParams: parseQueryString(),
  entries: initialState?.logEntries ?? {
    logEntries: [],
    totalCount: 0,
  },
});

onServerPrefetch(async () => {
  let username: string | undefined;

  if (typeof route.params.username === 'string') {
    username = route.params.username;
  } else if (currentUser.user) {
    username = currentUser.user.username;
  }

  await oops(async () => {
    if (!username) return;

    const results = await client.logEntries.listLogEntries(
      username,
      state.queryParams,
    );
    state.entries = {
      logEntries: results.logEntries.map((entry) => entry.toJSON()),
      totalCount: results.totalCount,
    };

    if (ctx) ctx.logEntries = state.entries;
  });
});
</script>
