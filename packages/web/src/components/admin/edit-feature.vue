<template>
  <form @submit.prevent="onSave">
    <fieldset class="space-y-3" :disabled="isSaving">
      <FormField
        label="Key"
        control-id="key"
        :responsive="responsive"
        :invalid="v$.key.$error"
        :error="v$.key.$errors[0]?.$message"
        :required="isNew"
      >
        <div v-if="isNew">
          <FormTextBox
            v-model.trim="formState.key"
            control-id="key"
            test-id="key"
            :maxlength="100"
            :autofocus="isNew"
            :invalid="v$.key.$error"
            placeholder="feature_flag_01"
          />
          <p class="text-sm italic pt-1">
            Keys must be lowercase, alphanumeric strings and may contain
            underscores.
          </p>
        </div>
        <p v-else class="font-mono">{{ feature.key }}</p>
      </FormField>

      <FormField
        label="Name"
        control-id="name"
        :responsive="responsive"
        :invalid="v$.name.$error"
        :error="v$.name.$errors[0]?.$message"
        required
      >
        <FormTextBox
          v-model.trim="formState.name"
          control-id="name"
          test-id="name"
          :maxlength="200"
          :invalid="v$.name.$error"
          :autofocus="!isNew"
          placeholder="My Feature Flag"
        />
      </FormField>

      <FormField
        label="Description"
        control-id="description"
        :responsive="responsive"
      >
        <FormTextArea
          v-model.trim="formState.description"
          control-id="description"
          test-id="description"
          :maxlength="1000"
          :rows="5"
          resize="none"
        />
      </FormField>

      <FormField
        label="Enabled"
        control-id="enabled"
        :responsive="responsive"
        required
      >
        <div class="pt-1">
          <FormToggle
            v-model="formState.enabled"
            control-id="enabled"
            test-id="enabled"
            :label="formState.enabled ? 'On' : 'Off'"
          />
        </div>
      </FormField>

      <div class="flex justify-center gap-3">
        <FormButton type="primary" :is-loading="isSaving" submit>
          Save Changes
        </FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { FeatureDTO, FeatureKeyRegex } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import { reactive, watch } from 'vue';

import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
import FormToggle from '../common/form-toggle.vue';

interface EditFeatureProps {
  feature: FeatureDTO;
  isNew?: boolean;
  isSaving?: boolean;
  responsive?: boolean;
}

const props = withDefaults(defineProps<EditFeatureProps>(), {
  isNew: false,
  isSaving: false,
  responsive: true,
});

const formState = reactive<FeatureDTO>({ ...props.feature });
const v$ = useVuelidate(
  {
    key: {
      required: helpers.withMessage('Feature flag key is required.', required),
      regex: helpers.withMessage(
        'Feature flag key is invalid.',
        helpers.regex(FeatureKeyRegex),
      ),
    },
    name: {
      required: helpers.withMessage('Feature flag name is required.', required),
    },
  },
  formState,
);

const emit = defineEmits<{
  (e: 'save', feature: FeatureDTO, isNew: boolean): void;
}>();

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (isValid) emit('save', { ...formState }, props.isNew);
}

watch(
  () => props.feature,
  () => {
    v$.value.$reset();
  },
);
</script>
