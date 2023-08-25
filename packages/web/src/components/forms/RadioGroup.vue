<template>
  <div class="control">
    <label v-for="option in options" :key="option.value" class="radio">
      <input
        type="radio"
        :name="id"
        :checked="option.value === value"
        :disabled="option.disabled"
        :value="option.value"
      />
      {{ option.text ?? option.value }}
    </label>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { DropDownOption } from '@/constants';

interface RadioGroupProps {
  id: string;
  modelValue: string | number;
  options: DropDownOption[];
}

const props = defineProps<RadioGroupProps>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();
const value = computed({
  get(): string | number {
    return props.modelValue;
  },
  set(value: string | number) {
    emit('update:modelValue', value);
  },
});
</script>
