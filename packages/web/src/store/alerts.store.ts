import { AlertDTO, ListAlertsResponseDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useAlerts = defineStore('alerts', () => {
  const currentAlert = ref<AlertDTO | null>(null);

  const results = reactive<ListAlertsResponseDTO>({
    alerts: [],
    totalCount: 0,
  });

  return { currentAlert, results };
});
