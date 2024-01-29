<template>
  <label>
    <span class="font-bold">{{ `${label}:` }}</span>
    <span v-if="required" class="text-danger">*</span>
  </label>
</template>

<script setup lang="ts">
type FormLabelProps = {
  for?: string;
  label: string;
  required?: boolean;
};

withDefaults(defineProps<FormLabelProps>(), {
  required: false,
});
</script>
