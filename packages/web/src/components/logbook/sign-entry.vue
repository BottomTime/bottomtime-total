<template>
  <div class="flex flex-col gap-3 items-center">
    <PreviewLogEntry :entry="entry" />

    <FormBox>
      <form @submit.prevent="">
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
            v-if="
              state.buddyType !== BuddyType.Buddy && state.association === ''
            "
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
                :maxlength="100"
                :invalid="v$.identificationNumber.$error"
              />
            </FormField>
          </div>

          <div class="text-center">
            <FormButton
              type="primary"
              submit
              :is-loading="state.isSigning"
              @click="onSign"
            >
              Sign
            </FormButton>
          </div>
        </fieldset>
      </form>
    </FormBox>
  </div>
</template>

<script lang="ts" setup>
import {
  AgencyDTO,
  BuddyType,
  CreateOrUpdateLogEntrySignatureDTO,
  LogEntryDTO,
  ProfessionalAssociationDTO,
} from '@bottomtime/api';

import useVuelidate from '@vuelidate/core';
import { helpers, requiredIf } from '@vuelidate/validators';

import { computed, reactive } from 'vue';

import { useClient } from '../../api-client';
import { SelectOption } from '../../common';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextBox from '../common/form-text-box.vue';
import PreviewLogEntry from './preview-log-entry.vue';

interface SignEntryProps {
  agencies: AgencyDTO[];
  entry: LogEntryDTO;
  professionalAssociations: ProfessionalAssociationDTO[];
  username: string;
}

interface SignEntryState {
  agencyId: string;
  association: string;
  buddyType: BuddyType;
  identificationNumber: string;
  isSigning: boolean;
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

const props = defineProps<SignEntryProps>();

const state = reactive<SignEntryState>({
  agencyId: '',
  association: props.professionalAssociations[0]?.id ?? '',
  buddyType: BuddyType.Buddy,
  identificationNumber: '',
  isSigning: false,
});

const credentials = computed<SelectOption[]>(() => [
  ...props.professionalAssociations.map((pa) => ({
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
  ...props.agencies.map((agency) => ({
    label: agency.name,
    value: agency.id,
  })),
]);

const v$ = useVuelidate(
  {
    agencyId: {
      required: helpers.withMessage(
        'Agency is required',
        requiredIf(() => state.association === ''),
      ),
    },
    identificationNumber: {
      required: helpers.withMessage(
        'Identification # is required',
        requiredIf(() => state.association === ''),
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
        const pa = props.professionalAssociations.find(
          (pa) => pa.id === state.association,
        );
        options.agency = pa?.agency.id;
        options.certificationNumber = pa?.identificationNumber;
      }
    }

    await client.logEntries.signLogEntry(
      props.username,
      props.entry.id,
      currentUser.user.username,
      options,
    );

    toasts.success('entry-signed', 'Log entry has been signed.');
  });

  state.isSigning = false;
}
</script>
