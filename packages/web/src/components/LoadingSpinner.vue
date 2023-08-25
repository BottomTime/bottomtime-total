<template>
  <span class="icon-text has-text-info">
    <span class="icon is-large">
      <i class="fas fa-spinner fa-lg fa-spin"></i>
    </span>
    <span
      ><em>{{ message }}</em></span
    >
  </span>
</template>

<script lang="ts" setup>
interface LoadingSpinnerProps {
  message: string;
}

withDefaults(defineProps<LoadingSpinnerProps>(), {
  message: 'Loading...',
});
</script>
