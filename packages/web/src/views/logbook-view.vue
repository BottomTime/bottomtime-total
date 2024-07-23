<template>
  <PageTitle title="Logbook" />
  <BreadCrumbs :items="[{ label: 'Logbook', active: true }]" />

  <DrawerPanel
    :full-screen="
      state.selectedEntry && username
        ? `/logbook/${username}/${state.selectedEntry.id}`
        : undefined
    "
    :title="dayjs(state.selectedEntry?.timing.entryTime.date).format('LLL')"
    :visible="state.showSelectedEntry"
    @close="onCloseLogEntry"
  >
    <div
      v-if="state.isLoadingLogEntry"
      class="flex items-center min-h-36 justify-center"
    >
      <p class="space-x-3 text-lg italic">
        <span>
          <i class="fa-solid fa-spinner fa-spin"></i>
        </span>
        <span>Loading log book entry...</span>
      </p>
    </div>

    <ViewLogbookEntry
      v-else-if="state.selectedEntry"
      :entry="state.selectedEntry"
    />
  </DrawerPanel>

  <div v-if="logEntries.listEntriesState === ListEntriesState.Forbidden">
    <div v-if="currentUser.user" class="text-center space-y-6">
      <p class="text-xl font-bold flex items-baseline gap-3 justify-center">
        <span>
          <i class="fa-solid fa-circle-exclamation fa-lg"></i>
        </span>
        <span>This logbook has not been shared with you.</span>
      </p>

      <p
        v-if="
          profiles.currentProfile?.logBookSharing === LogBookSharing.Private
        "
        data-testid="private-logbook"
      >
        <span class="font-bold">
          {{
            profiles.currentProfile.name ||
            `@${profiles.currentProfile.username}`
          }}
        </span>
        <span>
          is not sharing their logbook. You will not be able to view their
          entries.
        </span>
      </p>

      <div
        v-if="
          profiles.currentProfile?.logBookSharing === LogBookSharing.FriendsOnly
        "
      >
        <div
          v-if="currentUser.user"
          class="space-y-2"
          data-testid="friends-only-logbook"
        >
          <p>
            <span class="font-bold">
              {{
                profiles.currentProfile.name ||
                `@${profiles.currentProfile.username}`
              }}
            </span>
            <span>
              is only sharing their logbook with friends. Would you like to send
              them a friend request?
            </span>
          </p>

          <p>
            <span>You can do so <NavLink to="/friends">here</NavLink>.</span>
          </p>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-5">
      <LoginForm class="md:col-span-3 md:col-start-2" />
    </div>
  </div>

  <NotFound
    v-else-if="logEntries.listEntriesState === ListEntriesState.NotFound"
  />

  <div v-else class="grid gap-2 grid-cols-1 lg:grid-cols-4 xl:grid-cols-5">
    <div>
      <LogbookSearch :params="state.queryParams" @search="onSearch" />
    </div>

    <LogbookEntriesList
      class="col-span-1 lg:col-span-3 xl:col-span-4"
      :edit-mode="editMode"
      :entries="logEntries.results"
      :is-loading-more="state.isLoadingMoreEntries"
      @load-more="onLoadMore"
      @select="onSelectLogEntry"
      @sort-order-changed="onSortOrderChanged"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  ListLogEntriesParamsDTO,
  ListLogEntriesParamsSchema,
  LogBookSharing,
  LogEntryDTO,
  LogEntrySortBy,
  SortOrder,
  UserRole,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import qs from 'qs';
import { computed, onServerPrefetch, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import DrawerPanel from '../components/common/drawer-panel.vue';
import NavLink from '../components/common/nav-link.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import LogbookEntriesList from '../components/logbook/logbook-entries-list.vue';
import LogbookSearch from '../components/logbook/logbook-search.vue';
import ViewLogbookEntry from '../components/logbook/view-logbook-entry.vue';
import LoginForm from '../components/users/login-form.vue';
import { useLocation } from '../location';
import { useOops } from '../oops';
import {
  ListEntriesState,
  useCurrentUser,
  useLogEntries,
  useProfiles,
} from '../store';

interface LogbookViewState {
  isLoadingLogEntry: boolean;
  isLoadingMoreEntries: boolean;
  queryParams: ListLogEntriesParamsDTO;
  selectedEntry?: LogEntryDTO | null;
  showSelectedEntry: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
const location = useLocation();
const logEntries = useLogEntries();
const oops = useOops();
const profiles = useProfiles();
const route = useRoute();

const username = computed(() =>
  typeof route.params.username === 'string' ? route.params.username : '',
);

const editMode = computed(() => {
  // Anonymous users can never edit logbooks
  if (!currentUser.user) return false;

  // Admins can edit any user's logbook
  if (currentUser.user.role === UserRole.Admin) return true;

  // Regular users can edit their own logbook
  return route.params.username === currentUser.user.username;
});

function parseQueryParams(): ListLogEntriesParamsDTO {
  const parsed = ListLogEntriesParamsSchema.safeParse(route.query);
  return parsed.success
    ? {
        ...parsed.data,
        skip: 0,
      }
    : {};
}

const state = reactive<LogbookViewState>({
  isLoadingLogEntry: false,
  isLoadingMoreEntries: false,
  queryParams: parseQueryParams(),
  showSelectedEntry: false,
});

async function refresh(): Promise<void> {
  await oops(
    async () => {
      const results = await client.logEntries.listLogEntries(
        username.value,
        state.queryParams,
      );
      logEntries.results.logEntries = results.logEntries.map((entry) =>
        entry.toJSON(),
      );
      logEntries.results.totalCount = results.totalCount;
      logEntries.listEntriesState = ListEntriesState.Success;
    },
    {
      [401]: () => {
        // User _may_ have access to this logbook but they need to sign in.
        logEntries.listEntriesState = ListEntriesState.Forbidden;
      },
      [403]: () => {
        // User does not have access to this logbook.
        logEntries.listEntriesState = ListEntriesState.Forbidden;
      },
      [404]: () => {
        // Requested logbook does not exist.
        logEntries.listEntriesState = ListEntriesState.NotFound;
      },
    },
  );
}

onServerPrefetch(async () => {
  await refresh();

  if (currentUser.user) {
    await oops(async () => {
      profiles.currentProfile = await client.users.getProfile(username.value);
    });
  }
});

async function onLoadMore(): Promise<void> {
  state.isLoadingMoreEntries = true;

  await oops(async () => {
    const options = {
      ...state.queryParams,
      skip: logEntries.results.logEntries.length,
    };

    const results = await client.logEntries.listLogEntries(
      username.value,
      options,
    );

    logEntries.results.logEntries.push(
      ...results.logEntries.map((entry) => entry.toJSON()),
    );
    logEntries.results.totalCount = results.totalCount;
  });

  state.isLoadingMoreEntries = false;
}

async function onSelectLogEntry(dto: LogEntryDTO): Promise<void> {
  state.isLoadingLogEntry = true;
  state.selectedEntry = dto;
  state.showSelectedEntry = true;

  await oops(
    async () => {
      if (!username.value) return;
      const entry = await client.logEntries.getLogEntry(username.value, dto.id);

      state.selectedEntry = entry.toJSON();
    },
    {
      [404]: () => {
        state.selectedEntry = null;
      },
    },
  );

  state.isLoadingLogEntry = false;
}

function onCloseLogEntry() {
  state.showSelectedEntry = false;
  state.selectedEntry = undefined;
}

function onSearch(options: ListLogEntriesParamsDTO) {
  state.queryParams.query = options.query || undefined;
  state.queryParams.startDate = options.startDate || undefined;
  state.queryParams.endDate = options.endDate || undefined;

  const query = qs.stringify({
    ...state.queryParams,
    skip: undefined,
  });
  location.assign(`${route.path}?${query}`);
}

function onSortOrderChanged(sortBy: LogEntrySortBy, sortOrder: SortOrder) {
  state.queryParams.sortBy = sortBy;
  state.queryParams.sortOrder = sortOrder;

  const query = qs.stringify({
    ...state.queryParams,
    skip: undefined,
  });
  location.assign(`${route.path}?${query}`);
}
</script>
