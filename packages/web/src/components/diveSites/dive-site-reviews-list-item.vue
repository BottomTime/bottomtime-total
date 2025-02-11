<template>
  <li v-if="editMode">
    <EditDiveSiteReview
      v-if="editMode"
      :review="review"
      :is-saving="isSaving"
      @cancel="$emit('cancel', review)"
      @save="(updated) => $emit('save', updated)"
    />
  </li>

  <li v-else class="flex gap-4 items-center">
    <figure class="flex flex-col items-center min-w-36">
      <label class="font-bold">Rating</label>
      <StarRating :model-value="review.rating" readonly />

      <label class="font-bold">Difficulty</label>
      <DifficultyText :difficulty="review.difficulty" />
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
    </article>

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
  </li>
</template>

<script lang="ts" setup>
import { DiveSiteReviewDTO, UserRole } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed } from 'vue';

import { useCurrentUser } from '../../store';
import DifficultyText from '../common/difficulty-text.vue';
import EditDiveSiteReview from '../common/edit-dive-site-review.vue';
import FormButton from '../common/form-button.vue';
import StarRating from '../common/star-rating.vue';
import UserAvatar from '../users/user-avatar.vue';

interface DiveSiteReviewsListItemProps {
  editMode?: boolean;
  isSaving?: boolean;
  review: DiveSiteReviewDTO;
}

const currentUser = useCurrentUser();

const props = withDefaults(defineProps<DiveSiteReviewsListItemProps>(), {
  editMode: false,
  isSaving: false,
});
defineEmits<{
  (e: 'cancel', review: DiveSiteReviewDTO): void;
  (e: 'edit', review: DiveSiteReviewDTO): void;
  (e: 'delete', review: DiveSiteReviewDTO): void;
  (e: 'save', review: DiveSiteReviewDTO): void;
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
