<template>
  <li
    :class="`p-3 min-w-24 rounded-md text-md ${bgColour} shadow-lg shadow-grey-800/60 flex flex-row items-start gap-2`"
    :data-testid="`toast-${toastId}`"
    role="alert"
  >
    <span :class="`${icon} mt-1`"></span>
    <span class="grow">{{ message }}</span>
    <CloseButton @close="$emit('dismiss', toastId)" />
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { ToastType } from '../../common';
import CloseButton from '../common/close-button.vue';

type SnackBarToastProps = {
  toastId: string;
  message: string;
  type: ToastType;
};
const props = defineProps<SnackBarToastProps>();

const bgColour = computed(() => {
  switch (props.type) {
    case ToastType.Success:
      return 'bg-success';
    case ToastType.Error:
      return 'bg-danger';
    case ToastType.Warning:
      return 'bg-warn';
    case ToastType.Info:
    default:
      return 'bg-blue-500';
  }
});

const icon = computed(() => {
  switch (props.type) {
    case ToastType.Success:
      return 'far fa-lg fa-check-circle';
    case ToastType.Error:
      return 'fas fa-lg fa-exclamation-circle';
    case ToastType.Warning:
      return 'fas fa-lg fa-exclamation-triangle';
    case ToastType.Info:
    default:
      return 'fas fa-lg fa-info-circle';
  }
});

defineEmits<{
  (e: 'dismiss', toastId: string): void;
}>();
</script>
