<template>
  <div class="relative">
    <span
      class="absolute bottom-2 right-2 flex items-center text-lg pointer-events-none text-grey-500"
    >
      <i class="fas fa-caret-down"></i>
    </span>
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
  const width = props.stretch ? 'w-full' : 'w-auto';
  const highlightColour = props.invalid ? 'danger' : 'grey-600';
  return `p-1 pl-2 appearance-none border border-${highlightColour} focus:ring-${highlightColour} ${width} block pe-10 rounded-lg bg-grey-200 dark:bg-grey-300 disabled:bg-grey-400 disabled:dark:bg-grey-500 text-grey-950 disabled:text-grey-700`;
});

function focus() {
  selectInput.value?.focus();
}

defineExpose({ focus });

onMounted(() => {
  if (props.autofocus) focus();
});
</script>
