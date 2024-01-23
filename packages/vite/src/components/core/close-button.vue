<template>
  <a @click="$emit('dismiss')">
    <span
      class="fas fa-times-circle hover:text-grey-100 text-grey-800 hover:drop-shadow-lg"
    ></span>
  </a>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'dismiss'): void;
}>();
</script>
