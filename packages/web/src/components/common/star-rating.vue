<template>
  <div class="flex items-center gap-1">
    <StarRating
      :id="controlId"
      v-model="rating"
      class="mx-1"
      :data-testid="testId"
      :disable-click="readonly"
      :star-size="15"
    />
    <span v-if="showValue">{{ ratingText }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import StarRating from 'vue3-star-ratings';

type StarRatingProps = {
  controlId?: string;
  readonly?: boolean;
  showValue?: boolean;
  testId?: string;
};

const rating = defineModel<number>({ required: false, default: 0 });
withDefaults(defineProps<StarRatingProps>(), {
  readonly: false,
  showValue: true,
});

const ratingText = computed(() =>
  rating.value === 0 ? 'Not rated' : rating.value.toFixed(1),
);
</script>
