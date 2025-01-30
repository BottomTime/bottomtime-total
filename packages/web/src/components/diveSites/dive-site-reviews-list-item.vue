<template>
  <li class="flex gap-4 items-center">
    <figure class="flex flex-col items-center min-w-36">
      <label class="font-bold">Rating</label>
      <StarRating :model-value="review.rating" readonly />

      <label class="font-bold">Difficulty</label>
      <StarRating :model-value="review.difficulty" readonly />
    </figure>

    <article class="grow space-y-3">
      <div class="flex flex-col gap-3 grow">
        <div class="flex flex-col md:flex-row items-baseline gap-3">
          <UserAvatar :profile="review.creator" show-name />
          <p class="text-sm">{{ posted }}</p>
        </div>

        <p v-if="review.comments" class="italic text-pretty">
          {{ review.comments }}
        </p>
      </div>
      <div v-if="canEdit" class="min-w-fit">
        <FormButton rounded="left" @click="$emit('edit', review)">
          <span>
            <i class="fa-solid fa-pen"></i>
          </span>
          <span class="sr-only">
            Edit review from {{ dayjs(lastModified).format('LL') }}
          </span>
        </FormButton>
        <FormButton
          type="danger"
          rounded="right"
          @click="$emit('delete', review)"
        >
          <span>
            <i class="fa-solid fa-trash"></i>
          </span>
          <span class="sr-only">
            Delete review from {{ dayjs(lastModified).format('LL') }}
          </span>
        </FormButton>
      </div>
    </article>
  </li>
</template>

<script lang="ts" setup>
import { DiveSiteReviewDTO, UserRole } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed } from 'vue';

import { useCurrentUser } from '../../store';
import FormButton from '../common/form-button.vue';
import StarRating from '../common/star-rating.vue';
import UserAvatar from '../users/user-avatar.vue';

interface DiveSiteReviewsListItemProps {
  review: DiveSiteReviewDTO;
}

const currentUser = useCurrentUser();

const props = defineProps<DiveSiteReviewsListItemProps>();
defineEmits<{
  (e: 'edit', review: DiveSiteReviewDTO): void;
  (e: 'delete', review: DiveSiteReviewDTO): void;
}>();

const lastModified = computed(
  () => props.review.updatedOn ?? props.review.createdOn,
);
const posted = computed(() => dayjs(lastModified.value).fromNow());
const canEdit = computed(
  () =>
    currentUser.user?.role === UserRole.Admin ||
    currentUser.user?.id === props.review.creator.userId,
);
</script>
