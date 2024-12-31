<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="items" />

  <div v-if="state.isLoading" class="flex justify-center text-xl my-8">
    <LoadingSpinner message="Fetching log entry..." />
  </div>

  <div v-else-if="state.currentEntry">
    <EditLogbookEntry
      v-if="editMode"
      :entry="state.currentEntry"
      :is-saving="state.isSaving"
      :tanks="state.tanks.data"
      @save="onSave"
    />
    <ViewLogbookEntry v-else :entry="state.currentEntry" />
  </div>

  <NotFound v-else />
</template>

<script lang="ts" setup>
import {
  AccountTier,
  ApiList,
  CreateOrUpdateLogEntryParamsSchema,
  LogBookSharing,
  LogEntryDTO,
  TankDTO,
  UserRole,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb, ToastType } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import EditLogbookEntry from '../../components/logbook/edit-logbook-entry.vue';
import ViewLogbookEntry from '../../components/logbook/view-logbook-entry.vue';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';

interface LogEntryViewState {
  currentEntry?: LogEntryDTO;
  isLoading: boolean;
  isSaving: boolean;
  tanks: ApiList<TankDTO>;
}

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();
const router = useRouter();
const toasts = useToasts();

const state = reactive<LogEntryViewState>({
  isLoading: true,
  isSaving: false,
  tanks: {
    data: [],
    totalCount: 0,
  },
});

const username = computed(() =>
  Array.isArray(route.params.username)
    ? route.params.username[0]
    : route.params.username,
);
const entryId = computed(() => {
  if (!route.params.entryId) return undefined;

  return Array.isArray(route.params.entryId)
    ? route.params.entryId[0]
    : route.params.entryId;
});
const title = computed(() => {
  if (!state.currentEntry) return 'Log Entry';

  return Number.isNaN(state.currentEntry.timing.entryTime)
    ? 'New Log Entry'
    : dayjs(state.currentEntry.timing.entryTime).format('LLL');
});
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

onMounted(async () => {
  await Promise.all([
    oops(
      async () => {
        if (entryId.value) {
          state.currentEntry = await client.logEntries.getLogEntry(
            username.value,
            entryId.value,
          );
        } else {
          state.currentEntry = {
            createdAt: Date.now(),
            creator: currentUser.user?.profile ?? {
              accountTier: AccountTier.Basic,
              logBookSharing: LogBookSharing.Private,
              memberSince: 0,
              userId: '',
              username: '',
            },
            id: '',
            timing: {
              duration: 0,
              entryTime: NaN,
              timezone: '',
            },
          };
        }
      },
      {
        [403]: () => {
          state.currentEntry = undefined;
        },
        [404]: () => {
          state.currentEntry = undefined;
        },
      },
    ),
    oops(async () => {
      state.tanks = await client.tanks.listTanks({
        username: username.value,
        includeSystem: true,
      });
    }),
  ]);
  state.isLoading = false;
});

async function onSave(data: LogEntryDTO): Promise<void> {
  state.isSaving = true;
  await oops(async () => {
    const options = CreateOrUpdateLogEntryParamsSchema.parse({
      ...data,
      site: data.site?.id,
    });

    if (entryId.value) {
      // Entry has an ID: save existing.
      state.currentEntry = await client.logEntries.updateLogEntry(
        username.value,
        entryId.value,
        options,
      );
    } else {
      // An ID has not been assigned yet: create new.
      state.currentEntry = await client.logEntries.createLogEntry(
        username.value,
        options,
      );
      await router.push(`/logbook/${username.value}/${state.currentEntry.id}`);
    }

    toasts.toast({
      id: 'log-entry-saved',
      message: 'Log entry has been successfully saved',
      type: ToastType.Success,
    });
  });

  state.isSaving = false;
}
</script>
