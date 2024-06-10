import { ListLogEntriesResponseDTO, LogEntryDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useLogEntries = defineStore('logEntries', () => {
  const currentEntry = ref<LogEntryDTO | null>(null);

  const results = reactive<ListLogEntriesResponseDTO>({
    logEntries: [],
    totalCount: 0,
  });

  return { currentEntry, results };
});
