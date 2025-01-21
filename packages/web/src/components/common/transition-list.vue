<template>
  <TransitionGroup name="list-fade" tag="ul" :class="classes">
    <slot></slot>
  </TransitionGroup>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const classes = computed(() => ({
  '*:border-b-2': true,
  '*:border-secondary': true,
  '*:p-2': true,
  'last:*:border-0': true,
}));
</script>
