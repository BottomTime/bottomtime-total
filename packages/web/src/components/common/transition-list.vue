<template>
  <TransitionGroup name="list-fade" tag="ul" :class="classes">
    <slot></slot>
  </TransitionGroup>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface TransitionListProps {
  inverted?: boolean;
}

const props = withDefaults(defineProps<TransitionListProps>(), {
  inverted: false,
});

const classes = computed(() => ({
  'even:*:bg-blue-900/40': props.inverted,
  'dark:even:*:bg-blue-300/40': props.inverted,
  'even:*:bg-blue-300/40': !props.inverted,
  'dark:even:*:bg-blue-900/40': !props.inverted,
  '*:rounded-md': true,
  '*:p-2': true,
}));
</script>
