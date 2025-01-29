<template>
  <li class="flex gap-4 items-center">
    <figure class="flex flex-col items-center">
      <label class="font-bold">Rating</label>
      <StarRating :model-value="review.rating" readonly />

      <label class="font-bold">Difficulty</label>
      <StarRating :model-value="review.difficulty" readonly />
    </figure>

    <article class="space-y-3">
      <div class="flex items-baseline gap-3">
        <UserAvatar :profile="review.creator" show-name />
        <p>{{ posted }}</p>
      </div>

      <p v-if="review.comments" class="italic text-pretty">
        {{ review.comments }}
      </p>
    </article>
  </li>
</template>

<script lang="ts" setup>
import { DiveSiteReviewDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed } from 'vue';

import StarRating from '../common/star-rating.vue';
import UserAvatar from '../users/user-avatar.vue';

interface DiveSiteReviewsListItemProps {
  review: DiveSiteReviewDTO;
}

const props = defineProps<DiveSiteReviewsListItemProps>();

const posted = computed(() =>
  dayjs(props.review.updatedOn ?? props.review.createdOn).fromNow(),
);
</script>
