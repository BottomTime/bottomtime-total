<template>
  <form @submit.prevent="">
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
          <StarRating
            v-model.number="state.difficulty"
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
          :is-loading="isSaving"
          submit
          @click="onSave"
        >
          Save
        </FormButton>
        <FormButton @click="$emit('cancel')">Cancel</FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { DiveSiteReviewDTO } from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers, minValue } from '@vuelidate/validators';

import { reactive } from 'vue';

import FormButton from './form-button.vue';
import FormField from './form-field.vue';
import FormTextArea from './form-text-area.vue';
import StarRating from './star-rating.vue';

interface EditDiveSiteReviewProps {
  review: DiveSiteReviewDTO;
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
  rating: props.review?.rating ?? 0,
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
      required: helpers.withMessage('Rating is required', minValue(1)),
    },
  },
  state,
);

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  emit('save', {
    ...props.review,
    rating: state.rating,
    difficulty: state.difficulty === 0 ? undefined : state.difficulty,
    comments: state.comments,
  });
}
</script>
