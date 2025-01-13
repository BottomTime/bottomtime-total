<template>
  <div class="flex items-center gap-2">
    <StarRating
      :id="controlId"
      v-model="rating"
      :data-testid="testId"
      :disable-click="readonly"
    />
    <span>{{ ratingText }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import StarRating from 'vue3-star-ratings';

type StarRatingProps = {
  controlId?: string;
  readonly?: boolean;
  testId?: string;
};

const rating = defineModel<number | undefined>({ required: false });
withDefaults(defineProps<StarRatingProps>(), {
  readonly: false,
});

const ratingText = computed(() =>
  rating.value === undefined ? 'Not rated' : rating.value.toFixed(1),
);
</script>
