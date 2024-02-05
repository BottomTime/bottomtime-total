<template>
  <div
    :class="`bg-blue-100 dark:bg-blue-900 p-4 ${roundingStyle} shadow-md opacity-100`"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type FormBoxProps = {
  rounding?: 'none' | 'all' | 'top' | 'bottom';
};

const props = withDefaults(defineProps<FormBoxProps>(), {
  rounding: 'all',
});

const roundingStyle = computed(() => {
  switch (props.rounding) {
    case 'none':
      return '';
    case 'top':
      return 'rounded-t-md';
    case 'bottom':
      return 'rounded-b-md';
    case 'all':
    default:
      return 'rounded-md';
  }
});
</script>
