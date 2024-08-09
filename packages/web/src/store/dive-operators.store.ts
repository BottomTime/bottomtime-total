import {
  DiveOperatorDTO,
  SearchDiveOperatorsResponseDTO,
} from '@bottomtime/api';

import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useDiveOperators = defineStore('diveOperators', () => {
  const currentDiveOperator = ref<DiveOperatorDTO | null>(null);
  const results = reactive<SearchDiveOperatorsResponseDTO>({
    operators: [],
    totalCount: 0,
  });

  return { currentDiveOperator, results };
});
