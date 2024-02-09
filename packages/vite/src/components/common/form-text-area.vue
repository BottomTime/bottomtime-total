<template>
  <textarea
    :id="controlId"
    v-model="value"
    :class="`pl-2 pr-2 pb-1 w-full ${resize} border-2 border-${highlightColour} rounded-md shadow-blue-400 dark:shadow-blue-700 dark:text-grey-950 ring-2 ring-offset-1 ring-${highlightColour} caret-${highlightColour}`"
    :rows="rows"
    :cols="cols"
    :maxlength="maxlength"
    :data-testid="testId"
  >
  </textarea>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type FormTextAreaProps = {
  controlId: string;
  cols?: number;
  invalid?: boolean;
  maxlength?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  rows?: number;
  testId?: string;
};

const props = withDefaults(defineProps<FormTextAreaProps>(), {
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
</script>
