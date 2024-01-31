<template>
  <button :data-testid="testId" :aria-label="label" @click="$emit('close')">
    <span :class="`fas fa-times-circle ${colours} hover:drop-shadow-lg`"></span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type CloseButtonProps = {
  inverted?: boolean;
  label?: string;
  testId?: string;
};

const props = withDefaults(defineProps<CloseButtonProps>(), {
  inverted: false,
  label: 'Close',
});

defineEmits<{
  (e: 'close'): void;
}>();

const colours = computed(() => {
  return props.inverted
    ? 'text-grey-100 hover:text-grey-400'
    : 'text-grey-800 hover:text-grey-100';
});
</script>
