<template>
  <TransitionGroup
    class="absolute top-20 right-8 z-50 w-72 flex flex-col-reverse gap-4"
    name="toasts"
    tag="ul"
  >
    <SnackBarToast
      v-for="toast in toasts"
      :key="toast.id"
      :toast-id="toast.id"
      :message="toast.message"
      :type="toast.type"
      @dismiss="onDismiss"
    />
  </TransitionGroup>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Toast, ToastType } from '../../common';
import SnackBarToast from './snack-bar-toast.vue';
import { Dispatch, useStore } from '../../store';

const store = useStore();
const toasts = computed(() => store.state.toasts);

const ToastData: Toast[] = [
  {
    id: '1',
    message: 'Hey-o',
    type: ToastType.Info,
  },
  {
    id: '2',
    message:
      'Everything is awesome. Also, everything is bullshit. I hate UX. I hate CSS. Nothing ever works. Why do I bother? Why do I even bother?',
    type: ToastType.Success,
  },
  {
    id: '3',
    message: 'Ruh roh!',
    type: ToastType.Error,
  },
  {
    id: '4',
    message: 'Something is afoot',
    type: ToastType.Warning,
  },
];

function onDismiss(toastId: string): void {
  store.dispatch(Dispatch.DismissToast, toastId);
}
</script>

<style scoped>
.toasts-enter-active,
.toasts-leave-active {
  transition: all 0.7s ease;
}
.toasts-enter-from,
.toasts-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
