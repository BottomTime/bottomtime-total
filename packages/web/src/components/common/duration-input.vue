<template>
  <fieldset class="flex justify-between gap-0.5" :disabled="disabled">
    <FormTextBox
      v-model.trim="state.hours"
      placeholder="hh"
      :maxlength="2"
      :invalid="
        invalid || (state.hours.length > 0 && isNaN(parseInt(state.hours, 10)))
      "
      :control-id="controlId ? `${controlId}-hours` : undefined"
      :test-id="testId ? `${testId}-hours` : undefined"
      @blur="onBlurHours"
    />
    <span>:</span>
    <FormTextBox
      :id="controlId ? `${controlId}-minutes` : undefined"
      v-model.trim="state.minutes"
      placeholder="mm"
      :maxlength="2"
      :invalid="
        invalid ||
        (state.minutes.length > 0 && isNaN(parseInt(state.minutes, 10)))
      "
      :data-testid="testId ? `${testId}-minutes` : undefined"
      @blur="onBlurMinutes"
    />
    <span>:</span>
    <FormTextBox
      :id="controlId ? `${controlId}-seconds` : undefined"
      v-model.trim="state.seconds"
      placeholder="ss"
      :maxlength="2"
      :invalid="
        invalid ||
        (state.seconds.length > 0 && isNaN(parseInt(state.seconds, 10)))
      "
      :data-testid="testId ? `${testId}-seconds` : undefined"
      @blur="onBlurSeconds"
    />
  </fieldset>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue';

import FormTextBox from './form-text-box.vue';

interface DurationInputProps {
  controlId?: string;
  disabled?: boolean;
  invalid?: boolean;
  testId?: string;
}

interface DurationInputState {
  hours: string;
  minutes: string;
  seconds: string;
}

function parseValue(value: string | number): DurationInputState {
  if (typeof value === 'string') {
    return {
      hours: '',
      minutes: '',
      seconds: '',
    };
  }

  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toFixed(2).padStart(2, '0'),
  };
}

withDefaults(defineProps<DurationInputProps>(), {
  disabled: false,
  invalid: false,
});
const model = defineModel<string | number>({
  required: false,
  default: '',
});
const state = reactive<DurationInputState>(parseValue(model.value));

watch(state, (newValue) => {
  const hours = parseInt(newValue.hours, 10);
  const minutes = parseInt(newValue.minutes, 10);
  const seconds = parseInt(newValue.seconds, 10);

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    model.value = `${newValue.hours}:${newValue.minutes}:${newValue.seconds}`;
  }

  model.value = hours * 3600 + minutes * 60 + seconds;
});

function onBlurHours() {
  if (!isNaN(parseInt(state.hours, 10))) {
    state.hours = state.hours.padStart(2, '0');
  }
}

function onBlurMinutes() {
  if (!isNaN(parseInt(state.minutes, 10))) {
    state.minutes = state.minutes.padStart(2, '0');
  }
}

function onBlurSeconds() {
  if (!isNaN(parseInt(state.seconds, 10))) {
    state.seconds = state.seconds.padStart(2, '0');
  }
}
</script>
