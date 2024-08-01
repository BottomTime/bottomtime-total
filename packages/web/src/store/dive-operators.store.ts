import { SearchDiveOperatorsResponseDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useDiveOperators = defineStore('diveOperators', () => {
  const results = reactive<SearchDiveOperatorsResponseDTO>({
    operators: [],
    totalCount: 0,
  });

  return { results };
});
