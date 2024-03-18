<template>
  <TransitionGroup
    class="fixed top-20 right-8 z-50 w-72 flex flex-col-reverse gap-4"
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
import { useToasts } from '../../store';
import SnackBarToast from './snack-bar-toast.vue';

const store = useToasts();

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
