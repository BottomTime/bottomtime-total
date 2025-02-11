<template>
  <div>
    <FormSlider
      :id="controlId"
      v-model="difficulty"
      :data-testid="testId"
      :min="0"
      :max="5"
      :step="0.1"
    />
    <span>{{ difficultyText }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { getDifficultyString } from './difficulty-strings';
import FormSlider from './form-slider.vue';

interface DifficultyInputProps {
  controlId?: string;
  testId?: string;
}

defineProps<DifficultyInputProps>();

const difficulty = defineModel<number>({ required: false });
const difficultyText = computed(() => getDifficultyString(difficulty.value));
</script>
