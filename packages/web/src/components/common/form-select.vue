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
  return `bg-grey-200 border-2 ${
    props.invalid ? 'border-danger ' : 'border-grey-600'
  } text-grey-950 rounded-lg block py-1 px-2 h-8 dark:bg-grey-300 dark:placeholder-grey-400 disabled:bg-grey-400 disabled:text-grey-700 disabled:dark:bg-grey-500 ${width}`;
});

function focus() {
  selectInput.value?.focus();
}

defineExpose({ focus });

onMounted(() => {
  if (props.autofocus) focus();
});
</script>
