<template>
  <div class="control">
    <textarea
      :id="id"
      class="textarea is-small"
      v-model="value"
      :maxlength="maxlength"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, defineEmits, defineProps } from 'vue';

interface TextAreaProps {
  id: string;
  maxlength?: number;
  modelValue: string;
}

const props = defineProps<TextAreaProps>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const value = computed({
  get() {
    return props.modelValue;
  },
  set(value: string) {
    emit('update:modelValue', value);
  },
});
</script>
