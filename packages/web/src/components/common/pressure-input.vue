<template>
  <div class="space-y-1.5">
    <div class="relative">
      <FormTextBox
        v-model.number="pressure"
        :control-id="controlId"
        :test-id="testId"
        :invalid="invalid"
        :disabled="disabled"
        :maxlength="10"
      />
      <button
        :id="controlId ? `${controlId}-unit` : undefined"
        class="absolute inset-y-0 end-0 rounded-r-lg border border-grey-950 w-10 flex justify-center items-center text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover"
        :data-testid="testId ? `${testId}-unit` : undefined"
        :disabled="disabled"
        @click.prevent="
          $emit(
            'toggle-unit',
            unit === PressureUnit.Bar ? PressureUnit.PSI : PressureUnit.Bar,
          )
        "
      >
        {{ unit }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PressureUnit } from '@bottomtime/api';

import FormTextBox from './form-text-box.vue';

interface PressureInputProps {
  controlId?: string;
  disabled?: boolean;
  invalid?: boolean;
  testId?: string;
  unit?: PressureUnit;
}

const pressure = defineModel<number | string>({
  required: false,
  default: '',
});
withDefaults(defineProps<PressureInputProps>(), {
  disabled: false,
  invalid: false,
  unit: PressureUnit.Bar,
});
defineEmits<{
  (e: 'toggle-unit', newUnit: PressureUnit): void;
}>();
</script>
