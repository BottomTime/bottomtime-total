<template>
  <h1 v-if="level === 'h1'" class="text-2xl font-bold font-title">
    <slot></slot>
  </h1>

  <h2 v-else-if="level === 'h2'" class="text-xl font-bold font-title">
    <slot></slot>
  </h2>

  <h3 v-else-if="level === 'h3'" class="text-lg font-bold font-title">
    <slot></slot>
  </h3>

  <h4 v-else-if="level === 'h4'" class="text-md font-bold font-title">
    <slot></slot>
  </h4>
</template>

<script lang="ts" setup>
interface TextHeadingProps {
  level?: 'h1' | 'h2' | 'h3' | 'h4';
}

withDefaults(defineProps<TextHeadingProps>(), {
  level: 'h1',
});
</script>
