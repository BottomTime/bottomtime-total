<template>
  <TransitionGroup
    class="absolute top-20 right-8 z-50 w-72 flex flex-col-reverse gap-4"
    name="toasts"
    tag="ul"
  >
    <SnackBarToast
      v-for="toast in store.toasts"
      :key="toast.id"
      :toast-id="toast.id"
      :message="toast.message"
      :type="toast.type"
      @dismiss="onDismiss"
    />
  </TransitionGroup>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { Toast, ToastType } from '../../common';
import SnackBarToast from './snack-bar-toast.vue';
import { useToastsStore } from '../../store';

const store = useToastsStore();

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

onMounted(() => {
  ToastData.forEach(store.toast);
});

function onDismiss(toastId: string): void {
  store.dismissToast(toastId);
}
</script>

<style scoped>
.toasts-move,
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
