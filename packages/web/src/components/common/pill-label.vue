<template>
  <p
    :class="`inline-block ${bgColor} rounded-full px-2 font-title space-x-2 w-fit`"
  >
    <slot></slot>
  </p>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface PillLabelProps {
  type?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
}

const props = defineProps<PillLabelProps>();
const bgColor = computed(() => {
  switch (props.type) {
    case 'primary':
      return 'bg-primary';
    default:
    case 'success':
      return 'bg-success';
    case 'danger':
      return 'bg-danger';
    case 'warning':
      return 'bg-warning';
    case 'info':
      return 'bg-info';
  }
});
</script>
