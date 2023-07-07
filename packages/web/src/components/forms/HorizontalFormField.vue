<template>
  <div class="field is-horizontal">
    <div class="field-label is-normal">
      <label v-if="label" class="label" :for="controlId">
        {{ label }}<span v-if="required" class="has-text-danger">*</span>:
      </label>
    </div>
    <div class="field-body">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, withDefaults } from 'vue';

interface HorizontalFormFieldProps {
  controlId?: string;
  label?: string;
  required?: boolean;
}

withDefaults(defineProps<HorizontalFormFieldProps>(), {
  required: false,
});
</script>
