<template>
  <div
    class="flex-none h-30 pt-2 pb-7 font-title text-blue-950 dark:text-blue-200"
  >
    <p class="text-6xl mb-3">{{ title }}</p>
    <p v-if="subtitle" class="text-2xl">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
type PageTitleProps = {
  title: string;
  subtitle?: string;
};
defineProps<PageTitleProps>();
</script>
