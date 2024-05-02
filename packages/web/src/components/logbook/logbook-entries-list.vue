<template>
  <div class="flex flex-col space-y-3">
    <FormBox>
      <p>
        <span>Showing </span>
        <span class="font-bold">{{ entries.logEntries.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ entries.totalCount }}</span>
        <span> entries</span>
      </p>
    </FormBox>

    <ul>
      <LogbookEntriesListItem
        v-for="entry in entries.logEntries"
        :key="entry.id"
        :entry="entry"
      />
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ListLogEntriesResponseDTO } from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import LogbookEntriesListItem from './logbook-entries-list-item.vue';

interface LogbookEntriesListProps {
  entries: ListLogEntriesResponseDTO;
}

defineProps<LogbookEntriesListProps>();
</script>
