<template>
  <ConfirmDialog
    :visible="state.showConfirmRevert"
    title="Revert changes?"
    icon="fa-regular fa-circle-question fa-2x"
    confirm-text="Revert"
    @confirm="onConfirmRevert"
    @cancel="onCancelRevert"
  >
    <p>
      Are you sure you want to revert your unsaved changes? The log entry will
      be restored to the state that is currently saved.
    </p>

    <p>This cannot be undone.</p>
  </ConfirmDialog>

  <form data-testid="edit-log-entry" @submit.prevent="">
    <fieldset class="space-y-4" :disabled="isSaving">
      <!-- Basic Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <EditBasicInfo v-model="formData.basicInfo" />

        <!-- Dive Site / Dive Shop -->
        <EditDiveLocation v-model="formData.location" />

        <!-- Dive Conditions -->
        <EditConditions v-model="formData.conditions" />

        <!-- Breathing Gas -->
        <EditBreathingGas v-model="formData.air" :tanks="tanks" />

        <!-- Equipment -->
        <EditEquipment v-model="formData.equipment" />

        <!-- Notes -->
        <EditNotes v-model="formData.notes" />
      </div>

      <div
        v-if="v$.$error"
        class="text-danger text-lg"
        data-testid="form-errors"
      >
        <p class="font-bold">
          Unable to save dive log entry. Please correct the following errors and
          then try again:
        </p>
        <ul class="list-inside list-disc italic">
          <li v-for="error in v$.$errors" :key="error.$uid">
            <span>{{ error.$message }}</span>
          </li>
        </ul>
      </div>

      <div class="flex justify-center gap-3">
        <FormButton
          type="primary"
          :is-loading="isSaving"
          control-id="btnSave"
          test-id="save-entry"
          submit
          @click="onSave"
        >
          Save Changes
        </FormButton>

        <FormButton
          control-id="btnCancel"
          test-id="cancel-entry"
          @click="onRevert"
        >
          Cancel
        </FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import {
  DepthUnit,
  LogEntryDTO,
  PressureUnit,
  TankDTO,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';

import 'dayjs/plugin/timezone';
import { onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { useOops } from '../../../oops';
import { useCurrentUser } from '../../../store';
import FormButton from '../../common/form-button.vue';
import ConfirmDialog from '../../dialog/confirm-dialog.vue';
import EditBasicInfo from './edit-basic-info.vue';
import EditBreathingGas from './edit-breathing-gas.vue';
import EditConditions from './edit-conditions.vue';
import EditDiveLocation from './edit-dive-location.vue';
import EditEquipment from './edit-equipment.vue';
import EditNotes from './edit-notes.vue';
import { LogEntryFormData, dtoToFormData, formDataToDTO } from './types';

interface EditLogbookEntryProps {
  entry: LogEntryDTO;
  isSaving?: boolean;
  tanks: TankDTO[];
}

interface EditLogbookEntryState {
  isLoadingSite: boolean;
  showConfirmRevert: boolean;
  showSelectDiveSite: boolean;
  showSelectOperator: boolean;
}

const client = useClient();
const oops = useOops();
const currentUser = useCurrentUser();

const props = withDefaults(defineProps<EditLogbookEntryProps>(), {
  isSaving: false,
});
const emit = defineEmits<{
  (e: 'save', data: LogEntryDTO): void;
}>();

const state = reactive<EditLogbookEntryState>({
  isLoadingSite: false,
  showConfirmRevert: false,
  showSelectDiveSite: false,
  showSelectOperator: false,
});

const formData = reactive<LogEntryFormData>(
  dtoToFormData(props.entry, {
    depth: currentUser.user?.settings.depthUnit || DepthUnit.Meters,
    pressure: currentUser.user?.settings.pressureUnit || PressureUnit.Bar,
    temperature:
      currentUser.user?.settings.temperatureUnit || TemperatureUnit.Celsius,
    weight: currentUser.user?.settings.weightUnit || WeightUnit.Kilograms,
  }),
);
const v$ = useVuelidate<LogEntryFormData>({}, formData);

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  const dto = formDataToDTO(props.entry, formData);
  emit('save', dto);
}

function onRevert() {
  state.showConfirmRevert = true;
}

function onCancelRevert() {
  state.showConfirmRevert = false;
}

function onConfirmRevert() {
  Object.assign(
    formData,
    dtoToFormData(props.entry, {
      depth: currentUser.user?.settings.depthUnit || DepthUnit.Meters,
      pressure: currentUser.user?.settings.pressureUnit || PressureUnit.Bar,
      temperature:
        currentUser.user?.settings.temperatureUnit || TemperatureUnit.Celsius,
      weight: currentUser.user?.settings.weightUnit || WeightUnit.Kilograms,
    }),
  );
  state.showConfirmRevert = false;
}

onMounted(async () => {
  await oops(
    async () => {
      if (props.entry.site) {
        formData.location.site = await client.diveSites.getDiveSite(
          props.entry.site.id,
        );
      }
      if (props.entry.operator) {
        formData.location.operator = await client.operators.getOperator(
          props.entry.operator.id,
        );
      }
    },
    {
      [404]: () => {
        // Unable to retrieve info on dive site or operator
      },
    },
  );
});
</script>
