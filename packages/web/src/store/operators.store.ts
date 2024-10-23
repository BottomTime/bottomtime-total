import { OperatorDTO, SearchOperatorsResponseDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useOperators = defineStore('diveOperators', () => {
  const currentOperator = ref<OperatorDTO | null>(null);
  const results = reactive<SearchOperatorsResponseDTO>({
    operators: [],
    totalCount: 0,
  });

  return { currentOperator, results };
});
