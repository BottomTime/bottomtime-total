<template>
  <div class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline mb-3">
    <div class="lg:min-w-40 xl:min-w-48 lg:text-right">
      <FormLabel
        v-if="label"
        :label="label"
        :control-id="controlId"
        :required="required"
      />
    </div>
    <div class="grow w-full">
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
