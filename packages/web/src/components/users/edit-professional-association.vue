<template>
  <form @submit.prevent="">
    <fieldset class="space-y-3">
      <FormField
        label="Agency"
        control-id="agency"
        :invalid="v$.agencyId.$error"
        :error="v$.agencyId.$errors[0]?.$message"
        required
      >
        <FormSelect
          v-model="state.agencyId"
          control-id="agency"
          test-id="agency"
          :invalid="v$.agencyId.$error"
          :options="agencyOptions"
          stretch
        />
      </FormField>

      <FormField
        label="Professional ID/#"
        control-id="professional-id"
        :invalid="v$.professionalId.$error"
        :error="v$.professionalId.$errors[0]?.$message"
        required
      >
        <FormTextBox
          v-model.trim="state.professionalId"
          control-id="professional-id"
          test-id="professional-id"
          :maxlength="100"
          :invalid="v$.professionalId.$error"
        />
      </FormField>

      <FormField
        label="Title"
        control-id="title"
        :invalid="v$.title.$error"
        :error="v$.title.$errors[0]?.$message"
        required
      >
        <FormTextBox
          v-model.trim="state.title"
          control-id="title"
          test-id="title"
          :maxlength="200"
          :invalid="v$.title.$error"
        />
      </FormField>

      <FormField label="Start Date" control-id="date">
        <FormFuzzyDate
          v-model="state.startDate"
          control-id="start-date"
          test-id="start-date"
        />
      </FormField>

      <div class="text-center space-x-3">
        <FormButton
          type="primary"
          control-id="btn-save-assoc"
          test-id="btn-save-assoc"
          submit
          :is-loading="isSaving"
          @click="onSave"
        >
          Save
        </FormButton>

        <FormButton
          control-id="btn-cancel-assoc"
          test-id="btn-cancel-assoc"
          @click="$emit('cancel')"
        >
          Cancel
        </FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { AgencyDTO, ProfessionalAssociationDTO } from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import { computed, reactive, watch } from 'vue';

import { SelectOption } from '../../common';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormFuzzyDate from '../common/form-fuzzy-date.vue';
import FormSelect from '../common/form-select.vue';
import FormTextBox from '../common/form-text-box.vue';

interface EditProfessionalAssociationProps {
  agencies: AgencyDTO[];
  association?: ProfessionalAssociationDTO;
  isSaving?: boolean;
}

interface EditProfessionalAssociationState {
  agencyId: string;
  startDate: string;
  professionalId: string;
  title: string;
}

const props = withDefaults(defineProps<EditProfessionalAssociationProps>(), {
  isSaving: false,
});
const state = reactive<EditProfessionalAssociationState>({
  agencyId: props.association?.agency.id ?? '',
  startDate: props.association?.startDate ?? '',
  professionalId: props.association?.identificationNumber ?? '',
  title: props.association?.title ?? '',
});
const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'save', association: ProfessionalAssociationDTO): void;
}>();

const agencyOptions = computed<SelectOption[]>(() => [
  {
    label: '(Select agency)',
    value: '',
  },
  ...props.agencies.map((agency) => ({
    label: agency.longName
      ? `${agency.name} (${agency.longName})`
      : agency.name,
    value: agency.id,
  })),
]);

const v$ = useVuelidate(
  {
    agencyId: {
      required: helpers.withMessage('Agency is required', required),
    },
    professionalId: {
      required: helpers.withMessage('Professional ID/# is required', required),
    },
    title: {
      required: helpers.withMessage('Title is required', required),
    },
  },
  state,
);

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  const agency = props.agencies.find((a) => a.id === state.agencyId);
  if (!agency) return;

  emit('save', {
    agency,
    id: props.association?.id ?? '',
    identificationNumber: state.professionalId,
    title: state.title,
    startDate: state.startDate || undefined,
  });
}

watch(
  () => props.association,
  (association) => {
    state.agencyId = association?.agency.id ?? '';
    state.professionalId = association?.identificationNumber ?? '';
    state.title = association?.title ?? '';
    state.startDate = association?.startDate ?? '';
    v$.value.$reset();
  },
);
</script>
