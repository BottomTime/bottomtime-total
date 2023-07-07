<template>
  <div id="snackbar" class="snackbar">
    <TransitionGroup name="toasts">
      <ToastMessage
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        @close="onClose"
      />
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import ToastMessage from '@/components/main/ToastMessage.vue';
import { Dispatch, useStore } from '@/store';

const store = useStore();

const toasts = computed(() => store.getters.toasts);

async function onClose(toastId: string) {
  await store.dispatch(Dispatch.DismissToast, toastId);
}
</script>

<style>
.snackbar {
  min-width: 400px;
  margin-left: 200px;
  text-align: center;
  padding: 2px;
  position: fixed;
  z-index: 100;
  left: 50%;
  top: 30px;
}

.toasts-move, /* apply transition to moving elements */
.toasts-enter-active,
.toasts-leave-active {
  transition: all 0.5s ease;
}

.toasts-enter-from,
.toasts-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.toasts-leave-active {
  position: absolute;
}
</style>
