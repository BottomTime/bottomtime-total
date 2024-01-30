<template>
  <button @click="$emit('close')" :data-testid="testId" :aria-label="label">
    <span
      class="fas fa-times-circle hover:text-grey-100 text-grey-800 hover:drop-shadow-lg"
    ></span>
  </button>
</template>

<script setup lang="ts">
type CloseButtonProps = {
  label?: string;
  testId?: string;
};

withDefaults(defineProps<CloseButtonProps>(), {
  label: 'Close',
});

defineEmits<{
  (e: 'close'): void;
}>();
</script>
