<template>
  <PageTitle title="Logbook" />
  <BreadCrumbs :items="[{ label: 'Logbook', active: true }]" />

  <DrawerPanel
    :full-screen="
      state.selectedEntry && username
        ? `/logbook/${username}/${state.selectedEntry.id}`
        : undefined
    "
    :title="dayjs(state.selectedEntry?.entryTime.date).format('LLL')"
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

  <div v-if="state.entries === 'forbidden'">
    <div v-if="currentUser.user" class="text-center space-y-6">
      <p class="text-xl font-bold flex items-baseline gap-3 justify-center">
        <span>
          <i class="fa-solid fa-circle-exclamation fa-lg"></i>
        </span>
        <span>This logbook has not been shared with you.</span>
      </p>

      <p
        v-if="state.currentProfile?.logBookSharing === LogBookSharing.Private"
        data-testid="private-logbook"
      >
        <span class="font-bold">
          {{ state.currentProfile.name || `@${state.currentProfile.username}` }}
        </span>
        <span>
          is not sharing their logbook. You will not be able to view their
          entries.
        </span>
      </p>

      <div
        v-if="
          state.currentProfile?.logBookSharing === LogBookSharing.FriendsOnly
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
                state.currentProfile.name || `@${state.currentProfile.username}`
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

  <NotFound v-else-if="state.entries === 'not-found'" />

  <div v-else class="grid gap-2 grid-cols-1 lg:grid-cols-4 xl:grid-cols-5">
    <div>
      <LogbookSearch :params="state.queryParams" @search="onSearch" />
    </div>

    <LogbookEntriesList
      class="col-span-1 lg:col-span-3 xl:col-span-4"
      :edit-mode="editMode"
      :entries="state.entries"
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
  ListLogEntriesResponseDTO,
  LogBookSharing,
  LogEntryDTO,
  LogEntrySortBy,
  ProfileDTO,
  SortOrder,
  UserRole,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import qs from 'qs';
import { computed, onServerPrefetch, reactive, useSSRContext } from 'vue';
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
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

interface LogbookViewState {
  currentProfile?: ProfileDTO;
  entries: ListLogEntriesResponseDTO | 'not-found' | 'forbidden';
  isLoadingLogEntry: boolean;
  isLoadingMoreEntries: boolean;
  queryParams: ListLogEntriesParamsDTO;
  selectedEntry?: LogEntryDTO | null;
  showSelectedEntry: boolean;
}

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const location = useLocation();
const oops = useOops();
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
  currentProfile: initialState?.currentProfile,
  isLoadingLogEntry: false,
  isLoadingMoreEntries: false,
  entries: initialState?.logEntries ?? {
    logEntries: [],
    totalCount: 0,
  },
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
      state.entries = {
        logEntries: results.logEntries.map((entry) => entry.toJSON()),
        totalCount: results.totalCount,
      };
    },
    {
      [401]: () => {
        // User _may_ have access to this logbook but they need to sign in.
        state.entries = 'forbidden';
      },
      [403]: () => {
        // User does not have access to this logbook.
        state.entries = 'forbidden';
      },
      [404]: () => {
        // Requested logbook does not exist.
        state.entries = 'not-found';
      },
    },
  );
}

onServerPrefetch(async () => {
  await refresh();

  if (state.entries === 'not-found') {
    if (ctx) ctx.logEntries = state.entries;
    return;
  }

  if (currentUser.user) {
    await oops(async () => {
      state.currentProfile = await client.users.getProfile(username.value);
    });
  }

  if (ctx) {
    ctx.logEntries = state.entries;
    ctx.currentProfile = state.currentProfile;
  }
});

async function onLoadMore(): Promise<void> {
  state.isLoadingMoreEntries = true;

  await oops(async () => {
    if (!state.entries || typeof state.entries === 'string') return;

    const options = {
      ...state.queryParams,
      skip: state.entries.logEntries.length,
    };

    const results = await client.logEntries.listLogEntries(
      username.value,
      options,
    );

    state.entries.logEntries.push(
      ...results.logEntries.map((entry) => entry.toJSON()),
    );
    state.entries.totalCount = results.totalCount;
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
