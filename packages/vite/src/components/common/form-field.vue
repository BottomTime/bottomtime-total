<template>
  <div
    :class="`flex flex-col gap-2 ${
      responsive
        ? 'lg:flex-row lg:gap-4 lg:align-center lg:place-items-top'
        : ''
    } mb-3`"
  >
    <div
      v-if="label"
      :class="`${
        responsive ? 'lg:min-w-40 xl:min-w-48 lg:text-right lg:mt-1.5' : ''
      }`"
    >
      <FormLabel :label="label" :control-id="controlId" :required="required" />
    </div>
    <div class="grow w-full">
      <slot></slot>
      <span v-if="help && !invalid" class="text-sm italic">{{ help }}</span>
      <span
        v-if="invalid"
        class="text-sm text-danger-dark"
        :data-testid="`${controlId}-error`"
      >
        {{ error }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Ref } from 'vue';

import FormLabel from './form-label.vue';

type FormFieldProps = {
  controlId?: string;
  error?: string | Ref<string>;
  help?: string;
  label?: string;
  invalid?: boolean;
  required?: boolean;
  responsive?: boolean;
};

withDefaults(defineProps<FormFieldProps>(), {
  invalid: false,
  required: false,
  responsive: true,
});
</script>
