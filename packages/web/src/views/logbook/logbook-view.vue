<template>
  <PageTitle title="Logbook" />
  <BreadCrumbs :items="[{ label: 'Logbook', active: true }]" />

  <DrawerPanel
    :full-screen="editMode ? '' : selectedEntryUrl"
    :edit="editMode ? selectedEntryUrl : ''"
    :title="dayjs(state.selectedEntry?.timing.entryTime).format('LLL')"
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
      narrow
    />
  </DrawerPanel>

  <ConfirmDialog
    v-if="state.selectedEntry"
    confirm-text="Delete"
    title="Delete Log Entry?"
    :visible="state.showConfirmDelete"
    :is-loading="state.isDeleting"
    dangerous
    @cancel="onCancelDelete"
    @confirm="onConfirmDelete"
  >
    <p>Are you sure you want to delete the selected log entry?</p>

    <p class="font-bold text-center">
      {{
        dayjs(state.selectedEntry.timing.entryTime)
          .tz(state.selectedEntry.timing.timezone, true)
          .format('LLL')
      }}
      ({{ state.selectedEntry.timing.timezone }})
    </p>

    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <RequireAuth :authorizer="state.isAuthorized">
    <template #forbidden>
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
            {{
              state.currentProfile.name || `@${state.currentProfile.username}`
            }}
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
                  state.currentProfile.name ||
                  `@${state.currentProfile.username}`
                }}
              </span>
              <span>
                is only sharing their logbook with friends. Would you like to
                send them a friend request?
              </span>
            </p>

            <p>
              <span>You can do so <NavLink to="/friends">here</NavLink>.</span>
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #default>
      <div
        v-if="state.isLoading || !!state.logEntries"
        class="grid gap-2 grid-cols-1 lg:grid-cols-4 xl:grid-cols-5"
      >
        <div>
          <LogbookSearch :params="state.queryParams" @search="onSearch" />
        </div>

        <LogbookEntriesList
          class="col-span-1 lg:col-span-3 xl:col-span-4"
          :edit-mode="editMode"
          :entries="state.logEntries ?? { data: [], totalCount: 0 }"
          :is-loading="state.isLoading"
          :is-loading-more="state.isLoadingMoreEntries"
          @load-more="onLoadMore"
          @select="onSelectLogEntry"
          @sort-order-changed="onSortOrderChanged"
          @edit="onEdit"
          @delete="onDelete"
        />
      </div>

      <NotFound v-else />
    </template>
  </RequireAuth>
</template>

<script lang="ts" setup>
import {
  ApiList,
  ListLogEntriesParamsDTO,
  ListLogEntriesParamsSchema,
  LogBookSharing,
  LogEntryDTO,
  LogEntrySortBy,
  ProfileDTO,
  SortOrder,
  UserRole,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import DrawerPanel from '../../components/common/drawer-panel.vue';
import NavLink from '../../components/common/nav-link.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth2.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import LogbookEntriesList from '../../components/logbook/logbook-entries-list.vue';
import LogbookSearch from '../../components/logbook/logbook-search.vue';
import ViewLogbookEntry from '../../components/logbook/view-logbook-entry.vue';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';

interface LogbookViewState {
  currentProfile?: ProfileDTO;
  isAuthorized: boolean;
  isDeleting: boolean;
  isLoading: boolean;
  isLoadingLogEntry: boolean;
  isLoadingMoreEntries: boolean;
  logEntries?: ApiList<LogEntryDTO>;
  queryParams: ListLogEntriesParamsDTO;
  selectedEntry?: LogEntryDTO | null;
  showConfirmDelete: boolean;
  showSelectedEntry: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();
const router = useRouter();
const toasts = useToasts();

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
  isAuthorized: true,
  isDeleting: false,
  isLoading: false,
  isLoadingLogEntry: false,
  isLoadingMoreEntries: false,
  queryParams: parseQueryParams(),
  showConfirmDelete: false,
  showSelectedEntry: false,
});

const selectedEntryUrl = computed(() => {
  if (state.selectedEntry && username.value) {
    return `/logbook/${username.value}/${state.selectedEntry.id}`;
  }

  return '';
});

async function refresh(): Promise<void> {
  state.isLoading = true;

  await oops(
    async () => {
      state.logEntries = await client.logEntries.listLogEntries(
        username.value,
        state.queryParams,
      );
    },
    {
      [401]: () => {
        // User _may_ have access to this logbook but they need to sign in.
        state.isAuthorized = false;
      },
      [403]: () => {
        // User does not have access to this logbook.
        state.isAuthorized = false;
      },
      [404]: () => {
        // Requested logbook does not exist.
        state.logEntries = undefined;
      },
    },
  );
  state.isLoading = false;
}

onMounted(async () => {
  await refresh();

  if (currentUser.user) {
    await oops(async () => {
      state.currentProfile = await client.userProfiles.getProfile(
        username.value,
      );
    });
  }
});

async function onLoadMore(): Promise<void> {
  state.isLoadingMoreEntries = true;

  await oops(async () => {
    if (!state.logEntries) return;
    const options = {
      ...state.queryParams,
      skip: state.logEntries.data.length,
    };

    const results = await client.logEntries.listLogEntries(
      username.value,
      options,
    );

    state.logEntries.data.push(...results.data);
    state.logEntries.totalCount = results.totalCount;
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
      state.selectedEntry = await client.logEntries.getLogEntry(
        username.value,
        dto.id,
      );
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

async function onSearch(options: ListLogEntriesParamsDTO) {
  state.queryParams.query = options.query || undefined;
  state.queryParams.startDate = options.startDate || undefined;
  state.queryParams.endDate = options.endDate || undefined;
  state.queryParams.location = options.location || undefined;
  state.queryParams.radius = options.radius || undefined;
  state.queryParams.minRating = options.minRating || undefined;
  state.queryParams.maxRating = options.maxRating || undefined;

  await router.push({
    path: route.path,
    query: client.logEntries.searchQueryString(options),
  });

  await refresh();
}

async function onSortOrderChanged(
  sortBy: LogEntrySortBy,
  sortOrder: SortOrder,
) {
  state.queryParams.sortBy = sortBy;
  state.queryParams.sortOrder = sortOrder;

  await router.push({
    path: route.path,
    query: client.logEntries.searchQueryString(state.queryParams),
  });

  await refresh();
}

async function onEdit(selectedEntry: LogEntryDTO): Promise<void> {
  if (currentUser.user) {
    await router.push(
      `/logbook/${currentUser.user.username}/${selectedEntry.id}`,
    );
  }
}

function onDelete(selectedEntry: LogEntryDTO): void {
  state.selectedEntry = selectedEntry;
  state.showConfirmDelete = true;
}

function onCancelDelete() {
  state.showConfirmDelete = false;
}

async function onConfirmDelete(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    if (!currentUser.user || !state.selectedEntry) return;
    await client.logEntries.deleteLogEntry(
      currentUser.user.username,
      state.selectedEntry.id,
    );

    if (state.logEntries) {
      const index = state.logEntries.data.findIndex(
        (entry) => entry.id === state.selectedEntry?.id,
      );
      if (index > -1) {
        state.logEntries.data.splice(index, 1);
      }
    }

    state.showConfirmDelete = false;
    toasts.success('entry-deleted', 'Log entry has been deleted.');
  });

  state.isDeleting = false;
}
</script>
