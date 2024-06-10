import { ListTanksResponseDTO, TankDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useTanks = defineStore('tanks', () => {
  const currentTank = ref<TankDTO | null>(null);

  const results = reactive<ListTanksResponseDTO>({
    tanks: [],
    totalCount: 0,
  });

  return { currentTank, results };
});
