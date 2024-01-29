<template>
  <input
    ref="input"
    :type="password ? 'password' : 'text'"
    :class="`pl-2 pr-2 pt-1 pb-1 border-2 ${
      invalid ? 'border-danger' : 'border-grey-600'
    } outline-offset-1 rounded-md shadow-sm shadow-blue-400 text-sm`"
    :maxlength="maxlength"
    :placeholder="placeholder"
    :data-testid="testId"
    v-model="model"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

type FormTextBoxProps = {
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
