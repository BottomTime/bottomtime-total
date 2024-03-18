<template>
  <label :for="controlId">
    <span class="font-bold">{{ `${label}:` }}</span>
    <span v-if="required" class="text-danger">*</span>
  </label>
</template>

<script setup lang="ts">
type FormLabelProps = {
  controlId?: string;
  label: string;
  required?: boolean;
};

withDefaults(defineProps<FormLabelProps>(), {
  required: false,
});
</script>
