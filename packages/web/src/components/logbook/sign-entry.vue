<template>
  <FormBox>
    <LoadingSpinner v-if="state.isLoading" message="Please wait..." />

    <div
      v-else-if="state.isSigned"
      class="p-4 space-x-2 text-xl"
      data-testid="msg-entry-signed"
    >
      <span class="text-success">
        <i class="fa-solid fa-circle-check"></i>
      </span>
      <span>You have signed this logbook entry!</span>
    </div>

    <form v-else @submit.prevent="">
      <fieldset :disabled="state.isSigning">
        <FormField label="Sign as" control-id="sign-as">
          <FormSelect
            v-model="state.buddyType"
            control-id="sign-as"
            test-id="sign-as"
            :options="SignAsOptions"
          />
        </FormField>

        <div v-if="state.buddyType !== BuddyType.Buddy">
          <FormField
            class="flex flex-col gap-2"
            label="Professional association"
            control-id="association"
            required
          >
            <FormSelect
              v-model="state.association"
              control-id="association"
              test-id="association"
              :options="credentials"
            />
          </FormField>
        </div>

        <div
          v-if="state.buddyType !== BuddyType.Buddy && state.association === ''"
          class="flex gap-3"
        >
          <FormField
            label="Agency"
            control-id="agency"
            required
            :invalid="v$.agencyId.$error"
            :error="v$.agencyId.$errors[0]?.$message"
          >
            <FormSelect
              v-model="state.agencyId"
              control-id="agency"
              test-id="agency"
              :options="agencyOptions"
              :invalid="v$.agencyId.$error"
            />
          </FormField>

          <FormField
            label="Identification number"
            control-id="identification-number"
            required
            :invalid="v$.identificationNumber.$error"
            :error="v$.identificationNumber.$errors[0]?.$message"
          >
            <FormTextBox
              v-model.trim="state.identificationNumber"
              control-id="identification-number"
              test-id="identification-number"
              :maxlength="100"
              :invalid="v$.identificationNumber.$error"
            />
          </FormField>
        </div>

        <div class="text-center space-x-2">
          <FormButton
            type="primary"
            control-id="btn-sign"
            test-id="btn-sign"
            submit
            :is-loading="state.isSigning"
            @click="onSign"
          >
            Sign
          </FormButton>

          <FormButton
            v-if="props.showCancel"
            control-id="btn-cancel"
            test-id="btn-cancel"
            @click="$emit('cancel')"
          >
            Cancel
          </FormButton>
        </div>
      </fieldset>
    </form>
  </FormBox>
</template>

<script lang="ts" setup>
import {
  AgencyDTO,
  BuddyType,
  CreateOrUpdateLogEntrySignatureDTO,
  LogEntryDTO,
  LogEntrySignatureDTO,
  ProfessionalAssociationDTO,
} from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers, requiredIf } from '@vuelidate/validators';

import { computed, onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import { SelectOption } from '../../common';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextBox from '../common/form-text-box.vue';
import LoadingSpinner from '../common/loading-spinner.vue';

interface SignEntryProps {
  entry: LogEntryDTO;
  showCancel?: boolean;
}

interface SignEntryState {
  agencies: AgencyDTO[];
  agencyId: string;
  association: string;
  buddyType: BuddyType;
  identificationNumber: string;
  isLoading: boolean;
  isSigned: boolean;
  isSigning: boolean;
  professionalAssociations: ProfessionalAssociationDTO[];
}

const SignAsOptions: SelectOption[] = [
  {
    label: 'Buddy',
    value: BuddyType.Buddy,
  },
  {
    label: 'Dive Master',
    value: BuddyType.Divemaster,
  },
  {
    label: 'Instructor',
    value: BuddyType.Instructor,
  },
] as const;

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const toasts = useToasts();

const props = withDefaults(defineProps<SignEntryProps>(), {
  showCancel: false,
});
const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'signed', signature: LogEntrySignatureDTO): void;
}>();

const state = reactive<SignEntryState>({
  agencies: [],
  agencyId: '',
  association: '',
  buddyType: BuddyType.Buddy,
  identificationNumber: '',
  isLoading: true,
  isSigned: false,
  isSigning: false,
  professionalAssociations: [],
});

const credentials = computed<SelectOption[]>(() => [
  ...state.professionalAssociations.map((pa) => ({
    label: `${pa.agency.name} - ${pa.title} (#${pa.identificationNumber})`,
    value: pa.id,
  })),
  {
    label: '(Custom)',
    value: '',
  },
]);

const agencyOptions = computed<SelectOption[]>(() => [
  {
    label: '(Select agency)',
    value: '',
  },
  ...state.agencies.map((agency) => ({
    label: agency.name,
    value: agency.id,
  })),
]);

const v$ = useVuelidate(
  {
    agencyId: {
      required: helpers.withMessage(
        'Agency is required',
        requiredIf(
          () => state.buddyType !== BuddyType.Buddy && state.association === '',
        ),
      ),
    },
    identificationNumber: {
      required: helpers.withMessage(
        'Identification # is required',
        requiredIf(
          () => state.buddyType !== BuddyType.Buddy && state.association === '',
        ),
      ),
    },
  },
  state,
);

async function onSign(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  state.isSigning = true;

  await oops(async () => {
    if (!currentUser.user) return;

    const options: CreateOrUpdateLogEntrySignatureDTO = {
      buddyType: state.buddyType,
    };

    if (state.buddyType !== BuddyType.Buddy) {
      if (state.association === '') {
        options.agency = state.agencyId;
        options.certificationNumber = state.identificationNumber;
      } else {
        const pa = state.professionalAssociations.find(
          (pa) => pa.id === state.association,
        );
        options.agency = pa?.agency.id;
        options.certificationNumber = pa?.identificationNumber;
      }
    }

    const signature = await client.logEntries.signLogEntry(
      props.entry.creator.username,
      props.entry.id,
      currentUser.user.username,
      options,
    );
    state.isSigned = true;
    emit('signed', signature);

    toasts.success('entry-signed', 'Log entry has been signed.');
  });

  state.isSigning = false;
}

onMounted(async () => {
  await oops(async () => {
    if (!currentUser.user) return;
    const [agencies, associations, isSigned] = await Promise.all([
      client.certifications.listAgencies(),
      client.certifications.listProfessionalAssociations(
        currentUser.user.username,
      ),
      client.logEntries.logEntrySignatureExists(
        props.entry.creator.username,
        props.entry.id,
        currentUser.user.username,
      ),
    ]);

    state.agencies = agencies.data;
    state.professionalAssociations = associations.data;
    state.isSigned = isSigned;
  });
  state.isLoading = false;
});
</script>
