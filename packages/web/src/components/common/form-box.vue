<template>
  <div
    :class="`bg-blue-300 dark:bg-blue-900 p-3 ${roundingStyle} ${shadowStyle}`"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type FormBoxProps = {
  rounding?: 'none' | 'all' | 'top' | 'bottom';
  shadow?: boolean;
};

const props = withDefaults(defineProps<FormBoxProps>(), {
  rounding: 'all',
  shadow: true,
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
const shadowStyle = computed(() =>
  props.shadow ? 'shadow-md shadow-grey-800' : '',
);
</script>
