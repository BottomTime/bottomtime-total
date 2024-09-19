<template>
  <div class="flex flex-col space-y-3">
    <FormBox class="sticky top-16 flex flex-col gap-2" shadow>
      <div class="flex justify-between items-baseline">
        <p data-testid="entries-count">
          <span>Showing </span>
          <span class="font-bold">{{ entries.logEntries.length }}</span>
          <span> of </span>
          <span class="font-bold">{{ entries.totalCount }}</span>
          <span> entries</span>
        </p>

        <div class="flex gap-3 items-baseline">
          <label class="font-bold">Sort order:</label>
          <FormSelect
            v-model="sortOrder"
            :options="SortOrderOptions"
            control-id="sort-order"
            test-id="entries-sort-order"
          />
        </div>
      </div>

      <div
        v-if="editMode && currentUser.user"
        class="flex justify-between items-baseline"
      >
        <div class="space-x-2">
          <FormButton type="danger" :disabled="true" @click="onBulkDelete">
            <p class="space-x-2">
              <span>
                <i class="fa-solid fa-trash"></i>
              </span>
              <span>Delete</span>
            </p>
          </FormButton>
        </div>

        <div class="space-x-2">
          <a
            :href="`/logbook/${currentUser.user.username}/new`"
            data-testid="create-entry"
          >
            <FormButton type="primary" size="sm">Create Entry</FormButton>
          </a>
          <a
            :href="`/importLogs/${currentUser.user.username}`"
            data-testid="import-entries"
          >
            <FormButton size="sm">Import Entries...</FormButton>
          </a>
        </div>
      </div>
    </FormBox>

    <div
      v-if="isLoading"
      class="flex h-16 justify-center items-center gap-2 text-lg italic"
    >
      <LoadingSpinner message="Fetching logbook entries..." />
    </div>

    <ul
      v-else-if="entries.logEntries.length"
      class="px-2"
      data-testid="logbook-list"
    >
      <LogbookEntriesListItem
        v-for="entry in entries.logEntries"
        :key="entry.id"
        :edit-mode="editMode"
        :entry="entry"
        @select="(entry) => $emit('select', entry)"
      />

      <li
        v-if="entries.logEntries.length < entries.totalCount"
        class="min-h-24 text-center flex justify-center items-center"
      >
        <p
          v-if="isLoadingMore"
          class="text-xl italic space-x-3"
          data-testid="entries-loading-more"
        >
          <span>
            <i class="fa-solid fa-spinner fa-spin"></i>
          </span>
          <span>Loading more logbook entries...</span>
        </p>

        <FormButton
          v-else
          type="link"
          size="xl"
          test-id="logbook-load-more"
          @click="$emit('load-more')"
        >
          Load more entries...
        </FormButton>
      </li>
    </ul>

    <div
      v-else
      class="flex h-16 justify-center items-center gap-2 text-lg italic"
      data-testid="empty-logbook-message"
    >
      <span>
        <i class="fa-solid fa-circle-exclamation"></i>
      </span>
      <p>
        <span>No log entries match your search criteria! Click </span>
        <NavLink :to="`/logbook/${currentUser.user?.username}/new`">
          here
        </NavLink>
        <span> to add a new dive!</span>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ListLogEntriesResponseDTO,
  LogEntryDTO,
  LogEntrySortBy,
  SortOrder,
} from '@bottomtime/api';

import { ref, watch } from 'vue';

import { SelectOption } from '../../common';
import { useCurrentUser } from '../../store';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormSelect from '../common/form-select.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import NavLink from '../common/nav-link.vue';
import LogbookEntriesListItem from './logbook-entries-list-item.vue';

const SortOrderOptions: SelectOption[] = [
  {
    label: 'Entry time (latest to oldest)',
    value: `${LogEntrySortBy.EntryTime}-${SortOrder.Descending}`,
  },
  {
    label: 'Entry time (oldest to latest)',
    value: `${LogEntrySortBy.EntryTime}-${SortOrder.Ascending}`,
  },
];

const emit = defineEmits<{
  (e: 'load-more'): void;
  (e: 'select', entry: LogEntryDTO): void;
  (e: 'sort-order-changed', sortBy: LogEntrySortBy, sortOrder: SortOrder): void;
}>();

const currentUser = useCurrentUser();

interface LogbookEntriesListProps {
  editMode?: boolean;
  entries: ListLogEntriesResponseDTO;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  sortBy?: LogEntrySortBy;
  sortOrder?: SortOrder;
}

const props = withDefaults(defineProps<LogbookEntriesListProps>(), {
  editMode: false,
  isLoading: false,
  isLoadingMore: false,
  sortBy: LogEntrySortBy.EntryTime,
  sortOrder: SortOrder.Descending,
});

const sortOrder = ref(`${props.sortBy}-${props.sortOrder}`);

watch(sortOrder, (value) => {
  const [sortBy, sortOrder] = value.split('-') as [LogEntrySortBy, SortOrder];
  emit('sort-order-changed', sortBy, sortOrder);
});

async function onBulkDelete(): Promise<void> {
  /* TODO: Implement bulk delete on the backend */
}
</script>
