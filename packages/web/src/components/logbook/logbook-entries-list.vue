<template>
  <div class="flex flex-col space-y-3">
    <FormBox class="sticky top-16 flex justify-between items-center">
      <p>
        <span>Showing </span>
        <span class="font-bold">{{ entries.logEntries.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ entries.totalCount }}</span>
        <span> entries</span>
      </p>

      <div v-if="editMode && currentUser.user" class="space-x-2">
        <a :href="`/logbook/${currentUser.user.username}/new`">
          <FormButton type="primary" test-id="create-entry">
            Create Entry
          </FormButton>
        </a>
        <a :href="`/importLogs/${currentUser.user.username}`">
          <FormButton test-id="import-entries">Import Entries...</FormButton></a
        >
      </div>
    </FormBox>

    <ul class="px-2">
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
        <p v-if="isLoadingMore" class="text-xl italic space-x-3">
          <span>
            <i class="fa-solid fa-spinner fa-spin"></i>
          </span>
          <span>Loading more logbook entries...</span>
        </p>

        <FormButton v-else type="link" size="xl" @click="$emit('load-more')">
          Load more entries...
        </FormButton>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ListLogEntriesResponseDTO, LogEntryDTO } from '@bottomtime/api';

import { useCurrentUser } from '../../store';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import LogbookEntriesListItem from './logbook-entries-list-item.vue';

const currentUser = useCurrentUser();

interface LogbookEntriesListProps {
  editMode?: boolean;
  entries: ListLogEntriesResponseDTO;
  isLoadingMore?: boolean;
}

withDefaults(defineProps<LogbookEntriesListProps>(), {
  editMode: false,
  isLoadingMore: false,
});

defineEmits<{
  (e: 'load-more'): void;
  (e: 'select', entry: LogEntryDTO): void;
}>();
</script>
