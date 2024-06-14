<template>
  <div class="space-y-1.5">
    <div class="relative">
      <FormTextBox
        v-model.number="state.value"
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
        @click.prevent="onToggleUnit"
      >
        {{ state.unit }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { WeightDTO, WeightUnit } from '@bottomtime/api';

import { reactive, watch } from 'vue';

import { useCurrentUser } from '../../store';
import FormTextBox from './form-text-box.vue';

interface WeightInputProps {
  controlId?: string;
  disabled?: boolean;
  invalid?: boolean;
  testId?: string;
}
interface WeightInputState {
  value: string | number;
  unit: WeightUnit;
}

const currentUser = useCurrentUser();

const weight = defineModel<WeightDTO | string>({
  required: false,
  default: '',
});
withDefaults(defineProps<WeightInputProps>(), {
  disabled: false,
  invalid: false,
});

const state = reactive<WeightInputState>(
  typeof weight.value === 'string'
    ? {
        value: weight.value,
        unit: currentUser.user?.settings.weightUnit || WeightUnit.Kilograms,
      }
    : {
        value: weight.value?.weight || '',
        unit:
          weight.value?.unit ||
          currentUser.user?.settings.weightUnit ||
          WeightUnit.Kilograms,
      },
);

function onToggleUnit() {
  state.unit =
    state.unit === WeightUnit.Kilograms
      ? WeightUnit.Pounds
      : WeightUnit.Kilograms;
}

watch(state, () => {
  if (typeof state.value === 'string') {
    weight.value = state.value;
  } else {
    weight.value = {
      weight: state.value,
      unit: state.unit,
    };
  }
});

watch(weight, () => {
  if (typeof weight.value === 'string') {
    state.value = weight.value;
  } else {
    state.value = weight.value.weight;
    state.unit = weight.value.unit;
  }
});
</script>
