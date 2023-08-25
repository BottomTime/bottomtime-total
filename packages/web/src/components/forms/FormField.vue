<template>
  <div class="field">
    <label class="label" :for="controlId">
      {{ label }}<span v-if="required" class="has-text-danger">*</span>:
    </label>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
interface FormFieldProps {
  label: string;
  required?: boolean;
  controlId?: string;
}

withDefaults(defineProps<FormFieldProps>(), {
  required: false,
});
</script>
