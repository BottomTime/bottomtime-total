import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

import { Toast, ToastType } from '../common';

export type ToastWithTimer = Toast & { timer: NodeJS.Timeout };

export const useToasts = defineStore('toasts', () => {
  const toastsData = reactive<Record<string, ToastWithTimer>>({});

  function toast(toast: Toast) {
    if (toastsData[toast.id]) {
      clearTimeout(toastsData[toast.id].timer);
    }

    toastsData[toast.id] = {
      ...toast,
      timer: setTimeout(() => dismissToast(toast.id), 10000),
    };
  }

  function dismissToast(id: string) {
    if (toastsData[id]) {
      clearTimeout(toastsData[id].timer);
      delete toastsData[id];
    }
  }

  function success(id: string, message: string) {
    toast({ id, message, type: ToastType.Success });
  }

  function info(id: string, message: string) {
    toast({ id, message, type: ToastType.Info });
  }

  function warning(id: string, message: string) {
    toast({ id, message, type: ToastType.Warning });
  }

  function error(id: string, message: string) {
    toast({ id, message, type: ToastType.Error });
  }

  const toasts = computed(() => Object.values(toastsData));

  return { toasts, toast, dismissToast, success, info, warning, error };
});
