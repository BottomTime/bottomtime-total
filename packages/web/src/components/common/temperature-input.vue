<template>
  <fieldset class="space-y-1.5" :disabled="disabled">
    <div class="relative">
      <FormTextBox
        v-model.number="temperature"
        :control-id="controlId"
        :test-id="testId"
        :invalid="invalid"
        :maxlength="10"
      />
      <button
        :id="controlId ? `${controlId}-unit` : undefined"
        class="absolute inset-y-0 end-0 rounded-r-lg border border-grey-950 w-10 flex justify-center items-center text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover"
        :data-testid="testId ? `${testId}-unit` : undefined"
        @click.prevent="
          $emit(
            'toggle-unit',
            unit === TemperatureUnit.Celsius
              ? TemperatureUnit.Fahrenheit
              : TemperatureUnit.Celsius,
          )
        "
      >
        °{{ unit }}
      </button>
    </div>
  </fieldset>
</template>

<script lang="ts" setup>
import { TemperatureUnit } from '@bottomtime/api';

import FormTextBox from './form-text-box.vue';

interface TemperatureInputProps {
  controlId?: string;
  disabled?: boolean;
  invalid?: boolean;
  testId?: string;
  unit?: TemperatureUnit;
}

const temperature = defineModel<number | string>({
  required: false,
  default: '',
});
withDefaults(defineProps<TemperatureInputProps>(), {
  disabled: false,
  invalid: false,
  unit: TemperatureUnit.Celsius,
});
defineEmits<{
  (e: 'toggle-unit', newUnit: TemperatureUnit): void;
}>();
</script>
