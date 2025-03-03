<template>
  <div class="space-y-1.5">
    <div class="relative">
      <FormTextBox
        v-model.number="weight"
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
            unit === WeightUnit.Kilograms
              ? WeightUnit.Pounds
              : WeightUnit.Kilograms,
          )
        "
      >
        {{ unit }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { WeightUnit } from '@bottomtime/api';

import FormTextBox from './form-text-box.vue';

interface WeightInputProps {
  controlId?: string;
  disabled?: boolean;
  invalid?: boolean;
  testId?: string;
  unit?: WeightUnit;
}

const weight = defineModel<number | string>({
  required: false,
  default: '',
});
withDefaults(defineProps<WeightInputProps>(), {
  disabled: false,
  invalid: false,
  unit: WeightUnit.Kilograms,
});
defineEmits<{
  (e: 'toggle-unit', newUnit: WeightUnit): void;
}>();
</script>
