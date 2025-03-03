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
      v-model.trim="state.minutes"
      placeholder="mm"
      :maxlength="2"
      :invalid="
        invalid ||
        (state.minutes.length > 0 && isNaN(parseInt(state.minutes, 10)))
      "
      :control-id="controlId ? `${controlId}-minutes` : undefined"
      :data-testid="testId ? `${testId}-minutes` : undefined"
      @blur="onBlurMinutes"
    />
    <span>:</span>
    <FormTextBox
      v-model.trim="state.seconds"
      placeholder="ss"
      :maxlength="2"
      :invalid="
        invalid ||
        (state.seconds.length > 0 && isNaN(parseInt(state.seconds, 10)))
      "
      :control-id="controlId ? `${controlId}-seconds` : undefined"
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
const duration = defineModel<string | number>({
  required: false,
  default: '',
});
const state = reactive<DurationInputState>(parseValue(duration.value));

function updateModel() {
  const hours = parseInt(state.hours, 10);
  const minutes = parseInt(state.minutes, 10);
  const seconds = parseInt(state.seconds, 10);

  if (isNaN(hours) && isNaN(minutes) && isNaN(seconds)) {
    duration.value = '';
  } else {
    let newValue = 0;

    if (!isNaN(hours)) newValue += hours * 3600;
    if (!isNaN(minutes)) newValue += minutes * 60;
    if (!isNaN(seconds)) newValue += seconds;

    duration.value = newValue;
  }
}

watch(duration, (value) => {
  const { hours, minutes, seconds } = parseValue(value);
  state.hours = hours;
  state.minutes = minutes;
  state.seconds = seconds;
});

function onBlurHours() {
  const hours = parseInt(state.hours, 10);
  if (!isNaN(hours)) {
    state.hours = hours.toString().padStart(2, '0');
  }
  updateModel();
}

function onBlurMinutes() {
  const minutes = parseInt(state.minutes, 10);
  if (!isNaN(minutes)) {
    state.minutes = minutes.toString().padStart(2, '0');
  }
  updateModel();
}

function onBlurSeconds() {
  const seconds = parseFloat(state.seconds);
  if (!isNaN(seconds)) {
    state.seconds = seconds.toFixed(2).padStart(5, '0');
  }
  updateModel();
}
</script>
