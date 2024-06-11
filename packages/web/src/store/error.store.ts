import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useErrors = defineStore('errors', () => {
  const renderError = ref<unknown>(null);

  return { renderError };
});
