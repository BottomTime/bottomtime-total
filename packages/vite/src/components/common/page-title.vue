<template>
  <section class="flex-none h-30 pt-2 pb-7 font-title text-blue-950">
    <p class="text-6xl mb-6">{{ title }}</p>
    <p v-if="subtitle" class="text-2xl">{{ subtitle }}</p>
  </section>
</template>

<script setup lang="ts">
type PageTitleProps = {
  title: string;
  subtitle?: string;
};
defineProps<PageTitleProps>();
</script>
