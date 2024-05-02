<template>
  <div class="flex flex-col space-y-3">
    <FormBox class="sticky top-16">
      <p>
        <span>Showing </span>
        <span class="font-bold">{{ entries.logEntries.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ entries.totalCount }}</span>
        <span> entries</span>
      </p>
    </FormBox>

    <ul class="px-2">
      <LogbookEntriesListItem
        v-for="entry in entries.logEntries"
        :key="entry.id"
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

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import LogbookEntriesListItem from './logbook-entries-list-item.vue';

interface LogbookEntriesListProps {
  entries: ListLogEntriesResponseDTO;
  isLoadingMore?: boolean;
}

withDefaults(defineProps<LogbookEntriesListProps>(), {
  isLoadingMore: false,
});

defineEmits<{
  (e: 'load-more'): void;
  (e: 'select', entry: LogEntryDTO): void;
}>();
</script>
