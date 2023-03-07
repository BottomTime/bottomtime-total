<template>
  <div class="control">
    <input
      ref="input"
      :class="{ input: true, 'is-danger': errors?.length }"
      :type="password ? 'password' : 'text'"
      :placeholder="placeholder"
      v-model="value"
    />
    <span v-for="error in errors" :key="error.$uid" class="help is-danger">{{
      error.$message
    }}</span>
  </div>
</template>

<script lang="ts" setup>
import { ErrorObject } from '@vuelidate/core';
import {
  computed,
  defineEmits,
  defineExpose,
  defineProps,
  onMounted,
  ref,
  withDefaults,
} from 'vue';

interface TextBoxProps {
  autofocus?: boolean;
  errors?: ErrorObject[];
  modelValue: string | number;
  password?: boolean;
  placeholder?: string;
}

const input = ref<HTMLInputElement | null>();

const props = withDefaults(defineProps<TextBoxProps>(), {
  autofocus: false,
  password: false,
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();

const value = computed({
  get() {
    return props.modelValue;
  },
  set(value: string | number) {
    emit('update:modelValue', value);
  },
});

function focus() {
  input.value?.focus();
}

onMounted(() => {
  if (props.autofocus) focus();
});

defineExpose({
  focus,
});
</script>
