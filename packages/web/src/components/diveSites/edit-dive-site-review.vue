<template>
  <form @submit.prevent="" @keyup.escape.prevent="emit('cancel')">
    <fieldset class="space-y-3" :disabled="isSaving">
      <div class="grid grid-cols-2">
        <FormField
          label="Rating"
          required
          control-id="dive-site-review-rating"
          :invalid="v$.rating.$error"
          :error="v$.rating.$errors[0]?.$message"
        >
          <StarRating
            v-model.number="state.rating"
            test-id="dive-site-review-rating"
            control-id="dive-site-review-rating"
          />
        </FormField>

        <FormField label="Difficulty" control-id="dive-site-review-difficulty">
          <DifficultyInput
            v-model="state.difficulty"
            test-id="dive-site-review-difficulty"
            control-id="dive-site-review-difficulty"
          />
        </FormField>
      </div>

      <FormField label="Comments" control-id="dive-site-review-comments">
        <FormTextArea
          v-model.trim="state.comments"
          placeholder="Review this dive site..."
          control-id="dive-site-review-comments"
          test-id="dive-site-review-comments"
          :rows="6"
        />
      </FormField>

      <div class="flex gap-3 justify-center">
        <FormButton
          type="primary"
          control-id="dive-site-review-save"
          test-id="dive-site-review-save"
          :is-loading="isSaving"
          submit
          @click="onSave"
        >
          Save
        </FormButton>
        <FormButton
          control-id="dive-site-review-cancel"
          test-id="dive-site-review-cancel"
          @click="emit('cancel')"
        >
          Cancel
        </FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { DiveSiteReviewDTO } from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { between, helpers } from '@vuelidate/validators';

import { reactive, watch } from 'vue';

import { DefaultProfile } from '../../common';
import DifficultyInput from '../common/difficulty-input.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextArea from '../common/form-text-area.vue';
import StarRating from '../common/star-rating.vue';

interface EditDiveSiteReviewProps {
  review?: DiveSiteReviewDTO;
  isSaving?: boolean;
}

interface EditDiveSiteReviewState {
  rating: number;
  difficulty: number;
  comments: string;
}

const props = withDefaults(defineProps<EditDiveSiteReviewProps>(), {
  isSaving: false,
});
const state = reactive<EditDiveSiteReviewState>({
  rating: props.review?.rating ?? -1,
  difficulty: props.review?.difficulty ?? 0,
  comments: props.review?.comments ?? '',
});
const emit = defineEmits<{
  (e: 'save', review: DiveSiteReviewDTO): void;
  (e: 'cancel'): void;
}>();

const v$ = useVuelidate<EditDiveSiteReviewState>(
  {
    rating: {
      required: helpers.withMessage('Rating is required', between(0, 5)),
    },
  },
  state,
);

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  emit('save', {
    ...(props.review ?? {
      createdOn: Date.now(),
      creator: DefaultProfile,
      id: '',
    }),
    rating: state.rating,
    difficulty: state.difficulty === 0 ? undefined : state.difficulty,
    comments: state.comments,
  });
}

watch(
  () => props.review,
  (review) => {
    state.rating = review?.rating ?? 0;
    state.difficulty = review?.difficulty ?? 0;
    state.comments = review?.comments ?? '';
  },
);
</script>
