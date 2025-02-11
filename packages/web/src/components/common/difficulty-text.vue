<template>
  <div v-if="difficulty" class="min-w-20 relative group">
    <div class="flex items-baseline gap-1">
      <FormProgress :max="5" :model-value="difficulty" />
      <span>
        {{ difficulty.toFixed(1) }}
      </span>
    </div>
    <div
      class="invisible group-hover:visible text-pretty text-sm italic shadow-md shadow-grey-700/60 absolute top-[80%] -left-4 z-[50] p-1 rounded-md bg-secondary text-grey-800 min-w-32"
    >
      {{ difficultyText }}
    </div>
  </div>
  <span v-else>{{ difficultyText }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { getDifficultyString } from './difficulty-strings';
import FormProgress from './form-progress.vue';

interface DifficultyTextProps {
  difficulty?: number;
}

const props = defineProps<DifficultyTextProps>();
const difficultyText = computed(() => getDifficultyString(props.difficulty));
</script>
