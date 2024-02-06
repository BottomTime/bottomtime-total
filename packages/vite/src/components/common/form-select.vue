<template>
  <select
    :id="controlId"
    ref="selectInput"
    v-model="value"
    :class="`p-1 border-2 outline-offset-1 ${width} caret-${highlightColour} rounded-md shadow-sm shadow-blue-400 dark:shadow-blue-700 dark:text-grey-950`"
    :name="controlId"
  >
    <option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label ?? option.value }}
    </option>
  </select>
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
};

const value = defineModel<string>();
const props = withDefaults(defineProps<FormSelectProps>(), {
  autofocus: false,
  invalid: false,
  stretch: false,
});
const selectInput = ref<HTMLSelectElement | null>();
const highlightColour = computed(() => (props.invalid ? 'danger' : 'grey-600'));
const width = computed(() => (props.stretch ? 'w-full' : 'w-auto'));

function focus() {
  selectInput.value?.focus();
}

defineExpose({ focus });

onMounted(() => {
  if (props.autofocus) focus();
});
</script>
