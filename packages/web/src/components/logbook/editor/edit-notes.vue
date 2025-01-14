<template>
  <section class="border-2 border-secondary p-2 rounded-md space-y-3 px-6">
    <TextHeading class="-ml-3" level="h2">Notes</TextHeading>

    <FormField label="Notes" control-id="notes">
      <FormTextArea
        v-model="formData.notes"
        control-id="notes"
        test-id="notes"
        placeholder="Enter any other notes on the dive here"
        :maxlength="5000"
        :rows="6"
      />
    </FormField>

    <FormField label="Rating" control-id="rating">
      <StarRating id="rating" v-model="formData.rating" />
    </FormField>
  </section>
</template>

<script lang="ts" setup>
import FormField from '../../common/form-field.vue';
import FormTextArea from '../../common/form-text-area.vue';
import StarRating from '../../common/star-rating.vue';
import TextHeading from '../../common/text-heading.vue';
import { LogEntryNotes } from './types';

const formData = defineModel<LogEntryNotes>({ required: true });
</script>
