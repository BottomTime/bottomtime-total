<template>
  <div class="control">
    <input
      :id="id"
      ref="input"
      :class="inputClasses"
      :type="password ? 'password' : 'text'"
      :placeholder="placeholder"
      :maxlength="maxlength"
      v-model="value"
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
  id: string;
  errors?: ErrorObject[];
  maxlength?: number;
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

const inputClasses = computed(() => ({
  input: true,
  'is-danger': props.errors?.length,
  'is-small': true,
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
