<template>
  <div class="flex gap-2 items-baseline align-baseline w-full">
    <input
      :id="controlId"
      v-model.number="value"
      class="grow appearance-none h-2 rounded-full bg-grey-400 dark:bg-grey-600 cursor-pointer accent-blue-500 hover:dark:accent-blue-400 hover:accent-blue-600"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :data-testid="testId"
    />
    <span>{{ valueString }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

type FormSliderProps = {
  controlId?: string;
  max?: number;
  min?: number;
  step?: number;
  testId?: string;
};

const value = defineModel<number>({ default: 1, required: true });
withDefaults(defineProps<FormSliderProps>(), {
  min: 1,
  max: 5,
  step: 0.5,
});

const valueString = computed(() => value.value.toFixed(1));
</script>
