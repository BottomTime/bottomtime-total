<template>
  <p
    class="space-x-2 text-xs inline-block *:rounded-full *:bg-link *:text-grey-100"
  >
    <span v-for="tag in tags" :key="tag">{{ tag }}</span>
  </p>
</template>

<script lang="ts" setup>
const tags = defineModel<string[]>({ required: false, default: () => [] });
</script>
