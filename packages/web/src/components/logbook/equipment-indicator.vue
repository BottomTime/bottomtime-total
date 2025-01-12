<template>
  <p class="flex gap-2 items-baseline">
    <label class="font-bold text-right min-w-16">{{ label }}:</label>
    <span v-if="value === true" class="text-success">
      <i class="fas fa-check-circle"></i>
      <span class="sr-only">Yes</span>
    </span>
    <span v-else-if="value === false" class="text-secondary">
      <i class="fas fa-times-circle"></i>
      <span class="sr-only">No</span>
    </span>
    <span v-else class="sr-only">Unspecified</span>
  </p>
</template>

<script lang="ts" setup>
interface EquipmentIndicatorProps {
  label: string;
  value?: boolean;
}

defineProps<EquipmentIndicatorProps>();
</script>
