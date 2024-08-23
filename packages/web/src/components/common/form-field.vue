<template>
  <div class="space-y-0 mb-2 last:mb-4">
    <div v-if="label">
      <FormLabel :label="label" :control-id="controlId" :required="required" />
    </div>

    <div class="grow w-full pl-2">
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
};

withDefaults(defineProps<FormFieldProps>(), {
  invalid: false,
  required: false,
});
</script>
