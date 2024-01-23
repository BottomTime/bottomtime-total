<template>
  <img
    class="w-full h-full object-cover rounded-md"
    :src="source"
    :alt="alt"
    :aria-hidden="decorative"
  />
</template>

<script setup lang="ts">
type ImageBlockProps = {
  source: string;
  alt: string;
  decorative?: boolean;
};

defineProps<ImageBlockProps>();
</script>
