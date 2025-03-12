<template>
  <form @submit.prevent="">
    <fieldset class="space-y-3" :disabled="isSaving">
      <FormField
        label="Abbreviation"
        control-id="agency-name"
        :invalid="v$.name.$error"
        :error="v$.name.$errors[0]?.$message"
        required
      >
        <FormTextBox
          v-model.trim="state.name"
          control-id="agency-name"
          :maxlength="200"
          :invalid="v$.name.$error"
        />
      </FormField>

      <FormField
        label="Full name"
        control-id="agency-long-name"
        test-id="agency-long-name"
        :invalid="v$.longName.$error"
        :error="v$.longName.$errors[0]?.$message"
        required
      >
        <FormTextBox
          v-model.trim="state.longName"
          control-id="agency-long-name"
          test-id="agency-long-name"
          :maxlength="200"
          :invalid="v$.longName.$error"
        />
      </FormField>

      <FormField
        label="Website"
        control-id="agency-website"
        test-id="agency-website"
        :invalid="v$.website.$error"
        :error="v$.website.$errors[0]?.$message"
        required
      >
        <FormTextBox
          v-model.trim="state.website"
          control-id="agency-website"
          test-id="agency-website"
          :maxlength="250"
          :invalid="v$.website.$error"
        />
      </FormField>

      <div class="text-center space-x-2">
        <FormButton
          control-id="btn-save-agency"
          test-id="btn-save-agency"
          type="primary"
          class="space-x-1"
          submit
          :is-loading="isSaving"
          @click="onSave"
        >
          <span>
            <i class="fa-solid fa-floppy-disk"></i>
          </span>
          <span>Save</span>
        </FormButton>
        <FormButton
          control-id="btn-cancel-agency"
          test-id="btn-cancel-agency"
          @click="$emit('cancel')"
        >
          <span>Cancel</span>
        </FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { AgencyDTO } from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers, required, url } from '@vuelidate/validators';

import { reactive, watch } from 'vue';

import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';

interface EditAgencyProps {
  agency?: AgencyDTO;
  isSaving?: boolean;
}

interface EditAgencyState {
  name: string;
  longName: string;
  website: string;
}

const props = withDefaults(defineProps<EditAgencyProps>(), {
  isSaving: false,
});
const emit = defineEmits<{
  (e: 'save', agency: AgencyDTO): void;
  (e: 'cancel'): void;
}>();

const state = reactive<EditAgencyState>({
  name: props.agency?.name ?? '',
  longName: props.agency?.longName ?? '',
  website: props.agency?.website ?? '',
});

const v$ = useVuelidate(
  {
    name: {
      required: helpers.withMessage('Abbreviation is required', required),
      regex: helpers.withMessage(
        'Abbreviation must only contain letters, numbers, and whitespace',
        helpers.regex(/^[\s\w]+$/),
      ),
    },
    longName: {
      required: helpers.withMessage('Full name is required', required),
    },
    website: {
      required: helpers.withMessage('Website is required', required),
      url: helpers.withMessage('Website must be a valid URL', url),
    },
  },
  state,
);

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (isValid) {
    emit('save', {
      id: props.agency?.id || '',
      logo:
        props.agency?.logo || `/img/agencies/${state.name.toLowerCase()}.png`,
      name: state.name,
      longName: state.longName,
      website: state.website,
    });
  }
}

watch(
  () => props.agency,
  (agency) => {
    state.name = agency?.name ?? '';
    state.longName = agency?.longName ?? '';
    state.website = agency?.website ?? '';
  },
);
</script>
