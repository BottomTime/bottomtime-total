<template>
  <div class="grow rounded-full bg-grey-600 h-1.5 mb-4">
    <div :class="innerClasses" :style="{ width }"></div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface FormProgressProps {
  max?: number;
  type?: 'success' | 'warn' | 'danger' | 'link' | 'secondary' | 'primary';
}

const props = withDefaults(defineProps<FormProgressProps>(), {
  max: 100,
  type: 'secondary',
});
const progress = defineModel<number>({ required: false });
const width = computed(() => {
  let width = progress.value ?? 0;

  if (width > props.max) {
    width = props.max;
  }
  if (width < 0) {
    width = 0;
  }

  return `${((width / props.max) * 100).toFixed(1)}%`;
});

const innerClasses = computed(() => ({
  'rounded-full': true,
  'h-1.5': true,
  'bg-success': props.type === 'success',
  'bg-warn': props.type === 'warn',
  'bg-danger': props.type === 'danger',
  'bg-link': props.type === 'link',
  'bg-secondary': props.type === 'secondary',
  'bg-primary': props.type === 'primary',
}));
</script>
