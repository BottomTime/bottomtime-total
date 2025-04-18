<template>
  <form @submit.prevent="">
    <fieldset class="space-y-3" :disabled="isSaving">
      <FormField
        label="Rating"
        required
        control-id="operator-review-rating"
        :error="v$.rating.$errors[0]?.$message"
        :invalid="v$.rating.$error"
      >
        <StarRating
          v-model.number="state.rating"
          test-id="operator-review-rating"
          control-id="operator-review-rating"
        />
      </FormField>

      <FormField label="Comments" control-id="operator-review-comments">
        <FormTextArea
          v-model.trim="state.comments"
          placeholder="Review this dive shop..."
          control-id="operator-review-comments"
          test-id="operator-review-comments"
          :rows="6"
        />
      </FormField>

      <div class="flex gap-3 justify-center">
        <FormButton
          control-id="operator-review-save"
          test-id="operator-review-save"
          type="primary"
          :is-loading="isSaving"
          submit
          @click="onSave"
        >
          Save
        </FormButton>
        <FormButton
          control-id="operator-review-cancel"
          test-id="operator-review-cancel"
          @click="$emit('cancel')"
          >Cancel</FormButton
        >
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { OperatorReviewDTO } from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers, minValue } from '@vuelidate/validators';

import { reactive, watch } from 'vue';

import { DefaultProfile } from '../../common';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextArea from '../common/form-text-area.vue';
import StarRating from '../common/star-rating.vue';

interface EditOperatorReviewProps {
  review?: OperatorReviewDTO;
  isSaving?: boolean;
}

interface EditOperatorReviewState {
  rating: number;
  comments: string;
}

const props = withDefaults(defineProps<EditOperatorReviewProps>(), {
  isSaving: false,
});
const state = reactive<EditOperatorReviewState>({
  rating: props.review?.rating ?? 0,
  comments: props.review?.comments ?? '',
});
const emit = defineEmits<{
  (e: 'save', review: OperatorReviewDTO): void;
  (e: 'cancel'): void;
}>();

const v$ = useVuelidate<EditOperatorReviewState>(
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
    ...(props.review ?? {
      createdAt: Date.now(),
      creator: DefaultProfile,
      id: '',
      updatedAt: Date.now(),
    }),
    rating: state.rating,
    comments: state.comments,
  });
}

watch(
  () => props.review,
  (review) => {
    state.rating = review?.rating ?? 0;
    state.comments = review?.comments ?? '';
  },
);
</script>
