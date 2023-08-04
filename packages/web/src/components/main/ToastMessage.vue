<template>
  <div :id="`toast-${toast.id}`" :class="classes">
    <button
      :id="`btn-dismiss-toast-${toast.id}`"
      class="delete"
      @click="onClose"
    ></button>
    <div>
      <span class="is-size-5">
        <strong>{{ toast.message }}</strong>
      </span>
    </div>
    <div v-if="toast.description">
      <span class="is-size-6">{{ toast.description }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Toast } from '@/helpers';

interface ToastMessageProps {
  toast: Toast;
}

const props = defineProps<ToastMessageProps>();
const emit = defineEmits<{
  (e: 'close', toastId: string): void;
}>();

const classes = computed(() => ({
  notification: true,
  content: true,
  [props.toast.type]: true,
}));

function onClose() {
  emit('close', props.toast.id);
}
</script>
