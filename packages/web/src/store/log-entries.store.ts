import { ListLogEntriesResponseDTO, LogEntryDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export enum ListEntriesState {
  Success,
  NotFound,
  Forbidden,
}

export const useLogEntries = defineStore('logEntries', () => {
  const currentEntry = ref<LogEntryDTO | null>(null);

  const results = reactive<ListLogEntriesResponseDTO>({
    logEntries: [],
    totalCount: 0,
  });

  const listEntriesState = ref<ListEntriesState>(ListEntriesState.Success);

  return { currentEntry, listEntriesState, results };
});
