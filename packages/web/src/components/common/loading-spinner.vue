<template>
  <p class="space-x-3 italic">
    <span>
      <i class="fas fa-spinner fa-spin"></i>
    </span>
    <span>{{ message }}</span>
  </p>
</template>

<script lang="ts" setup>
interface LoadingSpinnerProps {
  message?: string;
}

withDefaults(defineProps<LoadingSpinnerProps>(), {
  message: 'Loading...',
});
</script>
