<template>
  <li class="flex gap-3 items-center">
    <figure class="min-w-36">
      <StarRating :model-value="review.rating" readonly />
    </figure>

    <article class="grow flex flex-col gap-4">
      <div class="flex flex-col md:flex-row gap-1 md:gap-3 items-baseline">
        <UserAvatar :profile="review.creator" show-name />
        <p class="text-sm">{{ posted }}</p>
      </div>

      <p v-if="review.comments" class="italic text-pretty">
        {{ review.comments }}
      </p>

      <div v-if="canEdit">
        <FormButton rounded="left" @click="$emit('edit', review)">
          <span>
            <i class="fa-solid fa-pen"></i>
          </span>
          <span class="sr-only">
            Edit review from {{ dayjs(review.updatedAt).format('LL') }}
          </span>
        </FormButton>
        <FormButton
          rounded="right"
          type="danger"
          @click="$emit('delete', review)"
        >
          <span>
            <i class="fa-solid fa-trash"></i>
          </span>
          <span class="sr-only"></span>
        </FormButton>
      </div>
    </article>
  </li>
</template>

<script lang="ts" setup>
import { OperatorReviewDTO, UserRole } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed } from 'vue';

import { useCurrentUser } from '../../store';
import FormButton from '../common/form-button.vue';
import StarRating from '../common/star-rating.vue';
import UserAvatar from '../users/user-avatar.vue';

interface OperatorReviewsListItemProps {
  review: OperatorReviewDTO;
}

const currentUser = useCurrentUser();

const props = defineProps<OperatorReviewsListItemProps>();
defineEmits<{
  (e: 'edit', review: OperatorReviewDTO): void;
  (e: 'delete', review: OperatorReviewDTO): void;
}>();

const posted = computed(() => dayjs(props.review.updatedAt).fromNow());
const canEdit = computed(
  () =>
    currentUser.user?.role === UserRole.Admin ||
    currentUser.user?.id === props.review.creator.userId,
);
</script>
