<template>
  <select
    :id="controlId"
    v-model="value"
    :class="`p-1 w-full border-2 outline-offset-1 rounded-md shadow-sm shadow-blue-400 dark:shadow-blue-700 text-sm dark:text-grey-950 border-${
      invalid ? 'danger' : 'grey-600'
    }`"
    :name="controlId"
  >
    <option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label ?? option.value }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { SelectOption } from '../../common';

type FormSelectProps = {
  controlId: string;
  invalid?: boolean;
  options: SelectOption[];
};

const value = defineModel<string>();
withDefaults(defineProps<FormSelectProps>(), {
  invalid: false,
});
</script>
