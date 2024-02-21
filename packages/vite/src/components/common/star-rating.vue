<template>
  <div class="flex gap-1.5 text-sm place-items-baseline">
    <div v-for="index of [1, 2, 3, 4, 5]" :key="index">
      <span v-if="rating < index - 1" class="fa-layers text-grey-500">
        <i class="far fa-star"></i>
      </span>
      <span v-if="rating >= index - 1 && rating < index" class="fa-layers">
        <i class="far fa-star text-grey-500"></i>
        <i class="fas fa-star-half text-warn-hover"></i>
      </span>
      <span v-if="rating >= index" class="text-warn-hover fa-layers">
        <i class="fas fa-star"></i>
      </span>
    </div>
    <span v-if="rating > 0">{{ rating.toFixed(2) }}</span>
  </div>
</template>

<script lang="ts" setup>
type StarRatingProps = {
  rating?: number;
  readonly?: boolean;
};

withDefaults(defineProps<StarRatingProps>(), {
  rating: 0,
  readonly: true,
});
</script>
