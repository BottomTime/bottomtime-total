import { FeatureDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useFeatures = defineStore('features', () => {
  const features = reactive<FeatureDTO[]>([]);
  return { features };
});
