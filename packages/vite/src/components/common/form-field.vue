<template>
  <div class="w-full flex flex-col items-stretch gap-2 pb-3">
    <FormLabel :label="label" :control-id="controlId" :required="required" />
    <div>
      <slot></slot>
    </div>
    <span v-if="help && !invalid" class="text-sm italic">{{ help }}</span>
    <span
      v-if="invalid"
      class="text-sm text-danger-dark"
      :data-testid="`${controlId}-error`"
    >
      {{ error }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { Ref } from 'vue';

import FormLabel from './form-label.vue';

type FormFieldProps = {
  controlId?: string;
  error?: string | Ref<string>;
  help?: string;
  label: string;
  invalid?: boolean;
  required?: boolean;
};

withDefaults(defineProps<FormFieldProps>(), {
  invalid: false,
  required: false,
});
</script>
