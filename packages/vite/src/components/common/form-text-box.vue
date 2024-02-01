<template>
  <input
    :id="controlId"
    ref="input"
    v-model="model"
    :type="password ? 'password' : 'text'"
    :class="`pl-2 pr-2 pt-1 pb-1 w-full border-2 rounded-md shadow-sm shadow-blue-400 dark:shadow-blue-700 text-sm dark:text-grey-950 border-${
      invalid ? 'danger' : 'grey-600'
    }`"
    :maxlength="maxlength"
    :placeholder="placeholder"
    :data-testid="testId"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

type FormTextBoxProps = {
  controlId?: string;
  invalid?: boolean;
  maxlength?: number;
  password?: boolean;
  placeholder?: string;
  testId?: string;
};

withDefaults(defineProps<FormTextBoxProps>(), {
  invalid: false,
  password: false,
});

const model = defineModel<string>();
const input = ref<HTMLInputElement | null>();

function focus() {
  input.value?.focus();
}

defineExpose({ focus });
</script>
