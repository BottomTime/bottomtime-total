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

  <SaveWarning :is-dirty="state.isDirty" :is-saving="isSaving" @save="onSave" />

  <form data-testid="edit-log-entry" @submit.prevent="">
    <fieldset class="space-y-4" :disabled="isSaving">
      <!-- Basic Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
        <EditBasicInfo v-model="formData.basicInfo" />

        <!-- Dive Site / Dive Shop -->
        <EditDiveLocation v-model="formData.location" />

        <!-- Breathing Gas -->
        <EditBreathingGas v-model="formData.air" :tanks="tanks" />

        <!-- Dive Conditions -->
        <EditConditions v-model="formData.conditions" />

        <!-- Equipment -->
        <EditEquipment v-model="formData.equipment" />

        <!-- Notes -->
        <EditNotes v-model="formData.notes" />

        <!-- Signatures -->
        <EditSignatures v-if="entry.id" :entry="entry" />
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
import { nextTick, onMounted, reactive, watch } from 'vue';

import { useClient } from '../../../api-client';
import { Logger } from '../../../logger';
import { useOops } from '../../../oops';
import { useCurrentUser } from '../../../store';
import FormButton from '../../common/form-button.vue';
import SaveWarning from '../../common/save-warning.vue';
import ConfirmDialog from '../../dialog/confirm-dialog.vue';
import EditBasicInfo from './edit-basic-info.vue';
import EditBreathingGas from './edit-breathing-gas.vue';
import EditConditions from './edit-conditions.vue';
import EditDiveLocation from './edit-dive-location.vue';
import EditEquipment from './edit-equipment.vue';
import EditNotes from './edit-notes.vue';
import EditSignatures from './edit-signatures.vue';
import {
  LogEntryFormData,
  SaveLogEntryData,
  dtoToFormData,
  formDataToDTO,
} from './types';

interface EditLogbookEntryProps {
  entry: LogEntryDTO;
  isSaving?: boolean;
  tanks: TankDTO[];
}

interface EditLogbookEntryState {
  isDirty: boolean;
  isLoadingAssociated: boolean;
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
  (e: 'save', data: SaveLogEntryData): void;
}>();

const state = reactive<EditLogbookEntryState>({
  isDirty: false,
  isLoadingAssociated: false,
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

  Logger.debug('Saving changes to log entry...');
  Logger.trace(JSON.stringify(formData, null, 2));
  const dto = formDataToDTO(props.entry, formData);
  emit('save', {
    entry: dto,
    siteReview: formData.location.siteReview,
    operatorReview: formData.location.operatorReview,
  });
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

async function loadAssociatedData(): Promise<void> {
  // Load data for associated dive site and operator
  state.isLoadingAssociated = true;

  await Promise.all([
    oops(async () => {
      if (props.entry.site) {
        formData.location.site = await client.diveSites.getDiveSite(
          props.entry.site.id,
        );
      }
    }),
    oops(async () => {
      if (props.entry.operator) {
        formData.location.operator = await client.operators.getOperator(
          props.entry.operator.slug,
        );
      }
    }),
  ]);

  formData.location.siteReview = undefined;
  formData.location.operatorReview = undefined;

  // Load reviews for the dive site and operator
  await Promise.any([
    oops(
      async () => {
        if (props.entry.site) {
          formData.location.siteReview = await client.logEntries.getSiteReview(
            props.entry.creator.username,
            props.entry.id,
          );
        }
      },
      {
        [404]: () => {
          // No review found
        },
      },
    ),
    oops(
      async () => {
        if (props.entry.operator) {
          formData.location.operatorReview =
            await client.logEntries.getOperatorReview(
              props.entry.creator.username,
              props.entry.id,
            );
        }
      },
      {
        [404]: () => {
          // No review found
        },
      },
    ),
  ]);
}

onMounted(async () => {
  Logger.debug('Mounting log entry editor...');
  Logger.trace(JSON.stringify(props.entry, null, 2));
  await loadAssociatedData();
  await nextTick();
  state.isDirty = false;
  state.isLoadingAssociated = false;
});
watch(
  () => props.entry,
  async (newValue): Promise<void> => {
    Logger.debug('Entry changed. Updating form...');
    Logger.trace(JSON.stringify(formData, null, 2));
    Object.assign(
      formData,
      dtoToFormData(newValue, {
        depth: currentUser.user?.settings.depthUnit || DepthUnit.Meters,
        pressure: currentUser.user?.settings.pressureUnit || PressureUnit.Bar,
        temperature:
          currentUser.user?.settings.temperatureUnit || TemperatureUnit.Celsius,
        weight: currentUser.user?.settings.weightUnit || WeightUnit.Kilograms,
      }),
    );

    await loadAssociatedData();
    await nextTick();
    state.isDirty = false;
    state.isLoadingAssociated = false;
  },
  { deep: true },
);

watch(
  formData,
  () => {
    state.isDirty = true;
  },
  { deep: true },
);
</script>
