<template>
  <button :data-testid="testId" :aria-label="label" @click="$emit('close')">
    <span :class="`${colours} hover:drop-shadow-lg`">
      <i class="fas fa-times-circle"></i>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type CloseButtonProps = {
  dangerous?: boolean;
  inverted?: boolean;
  label?: string;
  testId?: string;
};

const props = withDefaults(defineProps<CloseButtonProps>(), {
  dangerous: false,
  inverted: false,
  label: 'Close',
});

defineEmits<{
  (e: 'close'): void;
}>();

const colours = computed(() => {
  if (props.dangerous) {
    return 'text-danger hover:text-danger-hover';
  }

  return props.inverted
    ? 'text-grey-100 hover:text-grey-400 dark:text-grey-200 hover:dark:text-grey-500'
    : 'text-grey-800 hover:text-grey-100 dark:text-grey-200 hover:dark:text-grey-500';
});
</script>
