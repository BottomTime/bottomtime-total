<template>
  <div class="space-y-1.5">
    <div class="relative">
      <FormTextBox
        v-model.number="depth"
        :control-id="controlId"
        :invalid="invalid"
        :disabled="disabled || bottomless"
        :maxlength="10"
        :test-id="testId"
      />
      <button
        :id="controlId ? `${controlId}-unit` : undefined"
        class="absolute inset-y-0 end-0 rounded-r-lg border border-grey-950 w-10 flex justify-center items-center text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover"
        :data-testid="testId ? `${testId}-unit` : undefined"
        :disabled="disabled || bottomless"
        @click.prevent="
          $emit(
            'toggle-unit',
            unit === DepthUnit.Meters ? DepthUnit.Feet : DepthUnit.Meters,
          )
        "
      >
        <span>{{ unit }}</span>
      </button>
    </div>
    <FormCheckbox
      v-if="allowBottomless"
      v-model="bottomless"
      :control-id="controlId ? `${controlId}-bottomless` : undefined"
      :test-id="testId ? `${testId}-bottomless` : undefined"
      :disabled="disabled"
    >
      <p class="flex items-baseline text-justify">
        <span class="font-bold">Bottomless</span>
        <span class="text-sm italic">
          - Dive site has an unknown depth or the bottom would not be reachable
          for a typical diver.</span
        >
      </p>
    </FormCheckbox>
  </div>
</template>

<script lang="ts" setup>
import { DepthUnit } from '@bottomtime/api';

import { ref, watch } from 'vue';

import FormCheckbox from './form-checkbox.vue';
import FormTextBox from './form-text-box.vue';

interface DepthInputProps {
  allowBottomless?: boolean;
  controlId?: string;
  disabled?: boolean;
  invalid?: boolean;
  testId?: string;
  unit?: DepthUnit;
}

const depth = defineModel<number | string>({
  required: false,
  default: '',
});
const props = withDefaults(defineProps<DepthInputProps>(), {
  allowBottomless: false,
  disabled: false,
  invalid: false,
  unit: DepthUnit.Meters,
});
defineEmits<{
  (e: 'toggle-unit', newUnit: DepthUnit): void;
}>();

const bottomless = ref(props.allowBottomless && depth.value === 0);

watch(bottomless, (bottomless) => {
  depth.value = bottomless ? 0 : '';
});
</script>
