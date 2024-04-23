<template>
  <div>
    <select
      :id="controlId"
      ref="selectInput"
      v-model="value"
      :class="classes"
      :data-testid="testId"
      :name="controlId"
      :disabled="disabled"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label ?? option.value }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { SelectOption } from '../../common';

type FormSelectProps = {
  autofocus?: boolean;
  controlId: string;
  disabled?: boolean;
  invalid?: boolean;
  options: SelectOption[];
  stretch?: boolean;
  testId?: string;
};

const value = defineModel<string>();
const props = withDefaults(defineProps<FormSelectProps>(), {
  autofocus: false,
  disabled: false,
  invalid: false,
  stretch: false,
});
const selectInput = ref<HTMLSelectElement | null>();
const classes = computed(() => {
  const width = props.stretch ? 'w-full' : 'min-w-36';
  const highlightColour = props.invalid ? 'danger' : 'grey-600';
  return `bg-grey-200 border border-${highlightColour} text-grey-950 rounded-lg focus:ring-${highlightColour} focus:border-${highlightColour} block py-1 px-2 dark:bg-grey-300 dark:placeholder-grey-400 dark:focus:ring-${highlightColour} dark:focus:border-${highlightColour} disabled:bg-grey-400 disabled:text-grey-700 disabled:dark:bg-grey-500 ${width}`;
});

function focus() {
  selectInput.value?.focus();
}

defineExpose({ focus });

onMounted(() => {
  if (props.autofocus) focus();
});
</script>
