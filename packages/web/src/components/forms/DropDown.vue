<template>
  <div class="control">
    <div class="select is-rounded is-small">
      <select :id="id" v-model="value">
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.text ?? option.value }}
        </option>
      </select>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DropDownOption } from '@/constants';
import { computed } from 'vue';

interface DropDownProps {
  id: string;
  modelValue: string | number;
  options: Readonly<DropDownOption[]>;
}

const props = defineProps<DropDownProps>();
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
</script>
