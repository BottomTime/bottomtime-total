<template>
  <div>
    <span
      class="absolute bottom-6 end-3 flex items-center pe-3.5 text-lg pointer-events-none text-grey-500"
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
  invalid?: boolean;
  options: SelectOption[];
  stretch?: boolean;
  testId?: string;
};

const value = defineModel<string>();
const props = withDefaults(defineProps<FormSelectProps>(), {
  autofocus: false,
  invalid: false,
  stretch: false,
});
const selectInput = ref<HTMLSelectElement | null>();
const classes = computed(() => {
  const width = props.stretch ? 'w-full' : 'w-auto';
  const highlightColour = props.invalid ? 'danger' : 'grey-600';
  return `p-1 appearance-none border border-${highlightColour} focus:ring-${highlightColour} ${width} block pe-10 rounded-lg bg-gray-200 dark:bg-grey-300 text-black`;
});

function focus() {
  selectInput.value?.focus();
}

defineExpose({ focus });

onMounted(() => {
  if (props.autofocus) focus();
});
</script>
