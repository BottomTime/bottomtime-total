import { DiveSiteDTO, SearchDiveSitesResponseDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useDiveSites = defineStore('diveSites', () => {
  const currentSite = ref<DiveSiteDTO | null>(null);

  const results = reactive<SearchDiveSitesResponseDTO>({
    sites: [],
    totalCount: 0,
  });

  return { currentSite, results };
});
