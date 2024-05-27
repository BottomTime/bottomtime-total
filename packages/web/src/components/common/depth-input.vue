<template>
  <div class="space-y-1.5">
    <fieldset class="relative" :disabled="allowBottomless && state.bottomless">
      <FormTextBox
        v-model.number="state.value"
        :control-id="controlId"
        :invalid="invalid"
        :disabled="disabled"
        :maxlength="10"
        :test-id="testId"
      />
      <button
        class="absolute inset-y-0 end-0 rounded-r-lg border border-grey-950 w-10 flex justify-center items-center text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover"
        :data-testid="testId ? `${testId}-unit` : undefined"
        @click.prevent="onToggleUnit"
      >
        <span>{{ state.unit }}</span>
      </button>
    </fieldset>
    <FormCheckbox
      v-if="allowBottomless"
      v-model="state.bottomless"
      :control-id="controlId ? `${controlId}-bottomless` : undefined"
      :test-id="testId ? `${testId}-bottomless` : undefined"
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
import { DepthDTO, DepthUnit } from '@bottomtime/api';

import { reactive, watch } from 'vue';

import { useCurrentUser } from '../../store';
import FormCheckbox from './form-checkbox.vue';
import FormTextBox from './form-text-box.vue';

interface DepthInputProps {
  allowBottomless?: boolean;
  controlId?: string;
  disabled?: boolean;
  invalid?: boolean;
  testId?: string;
}
interface DepthInputState {
  bottomless: boolean;
  value: string | number;
  unit: DepthUnit;
}

const currentUser = useCurrentUser();

const depth = defineModel<DepthDTO | string>({
  required: false,
  default: '',
});
const props = withDefaults(defineProps<DepthInputProps>(), {
  allowBottomless: false,
  disabled: false,
  invalid: false,
});

const state = reactive<DepthInputState>(
  typeof depth.value === 'string'
    ? {
        bottomless: false,
        value: depth.value,
        unit: currentUser.user?.settings.depthUnit ?? DepthUnit.Meters,
      }
    : {
        bottomless: depth.value?.depth === 0,
        value: depth.value?.depth || '',
        unit:
          depth.value?.unit ??
          currentUser.user?.settings.depthUnit ??
          DepthUnit.Meters,
      },
);

function onToggleUnit() {
  state.unit =
    state.unit === DepthUnit.Meters ? DepthUnit.Feet : DepthUnit.Meters;
}

watch(state, () => {
  if (state.bottomless) {
    depth.value = {
      depth: 0,
      unit: state.unit,
    };
  } else if (!state.value) {
    depth.value = '';
  } else if (typeof state.value === 'number') {
    depth.value = {
      depth: state.value,
      unit: state.unit,
    };
  } else {
    depth.value = state.value;
  }
});

watch(depth, () => {
  if (typeof depth.value === 'string') {
    state.value = depth.value;
    return;
  }

  state.bottomless = props.allowBottomless && depth.value?.depth === 0;
  state.value = depth.value?.depth || '';
  state.unit =
    depth.value?.unit ??
    currentUser.user?.settings.depthUnit ??
    DepthUnit.Meters;
});
</script>
