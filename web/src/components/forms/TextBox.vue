<template>
  <div class="control">
    <input
      :id="id"
      ref="input"
      :class="inputClasses"
      :type="password ? 'password' : 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      v-model="value"
      @keyup.enter="() => emit('enter')"
      @keyup.escape="() => emit('escape')"
    />
    <span
      :id="`err-${id}-${error.$validator}`"
      v-for="error in errors"
      :key="error.$uid"
      class="help is-danger"
      >{{ error.$message }}</span
    >
  </div>
</template>

<script lang="ts" setup>
import { TextBoxSize } from '@/constants';
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
  disabled?: boolean;
  errors?: ErrorObject[];
  id: string;
  maxlength?: number;
  modelValue: string | number;
  password?: boolean;
  placeholder?: string;
  size?: TextBoxSize;
}

const input = ref<HTMLInputElement | null>();

const props = withDefaults(defineProps<TextBoxProps>(), {
  autofocus: false,
  disabled: false,
  password: false,
  size: TextBoxSize.Small,
});
const emit = defineEmits<{
  (e: 'enter'): void;
  (e: 'escape'): void;
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

const inputClasses = computed(() => ({
  input: true,
  'is-danger': props.errors?.length,
  'is-small': props.size === TextBoxSize.Small,
  'is-normal': props.size === TextBoxSize.Normal,
  'is-large': props.size === TextBoxSize.Large,
}));

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
