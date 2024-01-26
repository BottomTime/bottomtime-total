import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { Toast } from '../common';

export type ToastWithTimer = Toast & { timer: NodeJS.Timeout };

export const useToasts = defineStore('toasts', () => {
  const toastsData = ref<Record<string, ToastWithTimer>>({});

  function toast(toast: Toast) {
    if (toastsData.value[toast.id]) {
      clearTimeout(toastsData.value[toast.id].timer);
    }

    toastsData.value[toast.id] = {
      ...toast,
      timer: setTimeout(() => dismissToast(toast.id), 10000),
    };
  }

  function dismissToast(id: string) {
    if (toastsData.value[id]) {
      clearTimeout(toastsData.value[id].timer);
      delete toastsData.value[id];
    }
  }

  const toasts = computed(() => Object.values(toastsData.value));

  return { toasts, toast, dismissToast };
});
