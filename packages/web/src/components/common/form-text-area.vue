<template>
  <textarea
    :id="controlId"
    ref="textarea"
    v-model="value"
    :class="`px-2 py-1 w-full appearance-none ${resize} bg-grey-200 dark:bg-grey-300 disabled:bg-grey-400 disabled:dark:bg-grey-500 border-2 border-${highlightColour} rounded-md text-grey-950 disabled:text-grey-700 focus:ring-2 focus:ring-${highlightColour} placeholder-grey-500 caret-${highlightColour}`"
    :rows="rows"
    :cols="cols"
    :maxlength="maxlength"
    :placeholder="placeholder"
    :data-testid="testId"
  >
  </textarea>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

type FormTextAreaProps = {
  autofocus?: boolean;
  controlId: string;
  cols?: number;
  invalid?: boolean;
  maxlength?: number;
  placeholder?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  rows?: number;
  testId?: string;
};

const props = withDefaults(defineProps<FormTextAreaProps>(), {
  autofocus: false,
  invalid: false,
  resize: 'vertical',
});
const value = defineModel<string>();
const highlightColour = computed(() => (props.invalid ? 'danger' : 'grey-600'));
const resize = computed(() => {
  switch (props.resize) {
    case 'none':
      return 'resize-none';
    case 'vertical':
    default:
      return 'resize-y';
    case 'horizontal':
      return 'resize-x';
    case 'both':
      return 'resize';
  }
});
const textarea = ref<HTMLTextAreaElement | null>(null);

onMounted(() => {
  if (props.autofocus) {
    textarea.value?.focus();
  }
});
</script>
