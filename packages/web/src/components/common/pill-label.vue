<template>
  <div
    :class="`inline-block ${bgColor} rounded-full px-2 h-6 flex items-center w-fit shadow-sm shadow-grey-600 text-xs`"
  >
    <slot></slot>
  </div>
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
      return 'bg-secondary text-grey-950';
  }
});
</script>
