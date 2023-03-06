<template>
  <div class="field">
    <label class="label" :for="controlId">{{ label }}:</label>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, withDefaults } from 'vue';

interface FormFieldProps {
  label: string;
  required?: boolean;
  controlId?: string;
}

withDefaults(defineProps<FormFieldProps>(), {
  required: false,
});
</script>
