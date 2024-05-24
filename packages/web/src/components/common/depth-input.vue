<template>
  <div class="relative">
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
      @click="onToggleUnit"
    >
      <span>{{ state.unit }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { DepthDTO, DepthUnit } from '@bottomtime/api';

import { reactive, watch } from 'vue';

import { useCurrentUser } from '../../store';
import FormTextBox from './form-text-box.vue';

interface DepthInputProps {
  controlId?: string;
  disabled?: boolean;
  invalid?: boolean;
  testId?: string;
}
interface DepthUnitState {
  value: string | number;
  unit: DepthUnit;
}

const currentUser = useCurrentUser();

const depth = defineModel<DepthDTO | string | null>({
  required: false,
});
withDefaults(defineProps<DepthInputProps>(), {
  disabled: false,
  invalid: false,
});

const state = reactive<DepthUnitState>(
  typeof depth.value === 'string'
    ? {
        value: depth.value,
        unit: currentUser.user?.settings.depthUnit ?? DepthUnit.Meters,
      }
    : {
        value: depth.value?.depth ?? '',
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
  if (!state.value) {
    depth.value = null;
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

  state.value = depth.value?.depth ?? '';
  state.unit =
    depth.value?.unit ??
    currentUser.user?.settings.depthUnit ??
    DepthUnit.Meters;
});
</script>
