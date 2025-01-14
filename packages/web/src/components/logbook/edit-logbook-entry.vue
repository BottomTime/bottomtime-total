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

  <DrawerPanel
    title="Select Dive Site"
    :visible="state.showSelectDiveSite"
    @close="onCloseDiveSitePanel"
  >
    <SelectSite
      :current-site="formDataOld.site"
      :current-operator="formDataOld.operator"
      @site-selected="onSiteSelected"
    />
  </DrawerPanel>

  <DrawerPanel
    title="Select Dive Shop"
    :visible="state.showSelectOperator"
    @close="onCloseOperatorPanel"
  >
    <SelectOperator
      :current-operator="formDataOld.operator"
      @operator-selected="onOperatorSelected"
    />
  </DrawerPanel>

  <form data-testid="edit-log-entry" @submit.prevent="">
    <fieldset class="space-y-4" :disabled="isSaving">
      <!-- Basic Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <EditBasicInfo v-model="formData.basicInfo" />

        <!-- Dive Site / Dive Shop -->
        <section
          class="border-2 border-secondary p-2 rounded-md space-y-3 px-6"
        >
          <TextHeading class="-ml-3" level="h2">Location</TextHeading>
          <FormField label="Dive Shop">
            <div v-if="formDataOld.operator" class="space-y-2">
              <PreviewOperator :operator="formDataOld.operator" />
              <div class="flex gap-3 justify-center">
                <FormButton
                  size="xs"
                  test-id="btn-change-shop"
                  @click="onOpenOperatorPanel"
                >
                  Change dive shop...
                </FormButton>
                <FormButton
                  size="xs"
                  test-id="btn-remove-shop"
                  @click="onRemoveOperator"
                >
                  Remove dive shop
                </FormButton>
              </div>
            </div>

            <div v-else class="flex gap-3 items-center">
              <FormButton
                class="min-w-36"
                test-id="btn-select-operator"
                @click="onOpenOperatorPanel"
              >
                Select Dive Shop...
              </FormButton>
              <p class="text-lg">
                Were you diving with a dive shop? (E.g. on a chartered boat?)
              </p>
            </div>
          </FormField>

          <FormField label="Dive Site">
            <div v-if="state.isLoadingSite">
              <LoadingSpinner message="Fetching dive site..." />
            </div>

            <div v-else-if="formDataOld.site" class="space-y-2">
              <PreviewDiveSite :site="formDataOld.site" />
              <div class="flex gap-3 justify-center">
                <FormButton
                  size="xs"
                  test-id="btn-change-site"
                  @click="onOpenDiveSitePanel"
                >
                  Change site...
                </FormButton>
                <FormButton
                  size="xs"
                  test-id="btn-remove-site"
                  @click="onRemoveSite"
                >
                  Remove site
                </FormButton>
              </div>
            </div>

            <div v-else class="flex gap-3 items-center">
              <FormButton
                class="min-w-36"
                test-id="btn-select-site"
                @click="onOpenDiveSitePanel"
              >
                Select Dive Site...
              </FormButton>
              <p class="text-lg">
                Where did you dive? Pick out the dive site! Or if it's not in
                our database, you can add it so that you and other users can log
                dives there in the future!
              </p>
            </div>
          </FormField>
        </section>

        <!-- Dive Conditions -->
        <EditConditions v-model="formData.conditions" />

        <!-- Breathing Gas -->
        <section
          class="border-2 border-secondary p-2 rounded-md space-y-3 px-6"
        >
          <TextHeading class="-ml-3" level="h2">Breathing Gas</TextHeading>

          <FormField>
            <EditEntryAirCollection
              :air="formDataOld.air"
              :tanks="tanks"
              @add="onAddAirEntry"
              @update="onUpdateAirEntry"
              @remove="onRemoveAirEntry"
            />
          </FormField>
        </section>

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
  DiveSiteDTO,
  ExposureSuit,
  LogEntryAirDTO,
  LogEntryDTO,
  OperatorDTO,
  TankDTO,
  TankMaterial,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';

import dayjs from 'dayjs';
import 'dayjs/plugin/timezone';
import { v7 as uuid } from 'uuid';
import { onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';
import DrawerPanel from '../common/drawer-panel.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import TextHeading from '../common/text-heading.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import PreviewDiveSite from '../diveSites/preview-dive-site.vue';
import SelectSite from '../diveSites/selectSite/select-site.vue';
import PreviewOperator from '../operators/preview-operator.vue';
import SelectOperator from '../operators/selectOperator/select-operator.vue';
import EditEntryAirCollection from './edit-entry-air-collection.vue';
import { EditEntryAirFormData } from './edit-entry-air-form-data';
import EditBasicInfo from './editor/edit-basic-info.vue';
import EditConditions from './editor/edit-conditions.vue';
import EditEquipment from './editor/edit-equipment.vue';
import EditNotes from './editor/edit-notes.vue';
import { LogEntryFormData } from './editor/types';

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

interface LogEntryData {
  bottomTime: string | number;
  duration: string | number;
  surfaceInterval: string | number;
  entryTime?: Date;
  entryTimezone: string;
  logNumber: string | number;
  avgDepth: number | string;
  maxDepth: number | string;
  depthUnit: DepthUnit;
  notes: string;
  air: EditEntryAirFormData[];
  site?: DiveSiteDTO;
  operator?: OperatorDTO;
  weather: string;
  weight: number | string;
  weightUnit: WeightUnit;
  weightCorrectness: WeightCorrectness | '';
  trim: TrimCorrectness | '';
  exposureSuit: ExposureSuit | '';
  boots?: boolean;
  camera?: boolean;
  hood?: boolean;
  gloves?: boolean;
  scooter?: boolean;
  torch?: boolean;

  chop: number;
  current: number;
  visibility: number;

  airTemp: number | string;
  waterTemp: number | string;
  thermocline: number | string;
  tempUnit: TemperatureUnit;
  rating?: number;
}

function getFormDataFromProps(props: EditLogbookEntryProps): LogEntryFormData {
  return {
    basicInfo: {
      avgDepth: props.entry.depths?.averageDepth || '',
      bottomTime: props.entry.timing.bottomTime || '',
      depthUnit:
        props.entry.depths?.depthUnit ||
        currentUser.user?.settings.depthUnit ||
        DepthUnit.Meters,
      duration:
        props.entry.timing.duration === -1 ? '' : props.entry.timing.duration,
      entryTimezone: props.entry.timing.timezone || dayjs.tz.guess(),
      logNumber: props.entry.logNumber || '',
      maxDepth: props.entry.depths?.maxDepth || '',
      surfaceInterval: '', // TODO
      entryTime: Number.isNaN(props.entry.timing.entryTime)
        ? undefined
        : new Date(props.entry.timing.entryTime),
    },

    conditions: {
      airTemp: props.entry.conditions?.airTemperature || '',
      waterTemp: props.entry.conditions?.surfaceTemperature || '',
      thermocline: props.entry.conditions?.bottomTemperature || '',
      tempUnit:
        props.entry.conditions?.temperatureUnit ||
        currentUser.user?.settings.temperatureUnit ||
        TemperatureUnit.Celsius,

      chop: props.entry.conditions?.chop || 0,
      current: props.entry.conditions?.current || 0,
      visibility: props.entry.conditions?.visibility || 0,

      weather: props.entry.conditions?.weather || '',
    },

    equipment: {
      weight: props.entry.equipment?.weight || '',
      weightUnit:
        props.entry.equipment?.weightUnit ||
        currentUser.user?.settings.weightUnit ||
        WeightUnit.Kilograms,
      weightCorrectness: props.entry.equipment?.weightCorrectness || '',
      trim: props.entry.equipment?.trimCorrectness || '',
      exposureSuit: props.entry.equipment?.exposureSuit || '',

      boots: props.entry.equipment?.boots,
      camera: props.entry.equipment?.camera,
      gloves: props.entry.equipment?.gloves,
      hood: props.entry.equipment?.hood,
      scooter: props.entry.equipment?.scooter,
      torch: props.entry.equipment?.torch,
    },

    notes: {
      notes: props.entry.notes || '',
      rating: props.entry.rating,
    },
  };
}

function getFormDataFromPropsOld(props: EditLogbookEntryProps): LogEntryData {
  return {
    bottomTime: props.entry.timing.bottomTime ?? '',
    duration:
      props.entry.timing.duration === -1 ? '' : props.entry.timing.duration,
    surfaceInterval: '',
    entryTime: Number.isNaN(props.entry.timing.entryTime)
      ? undefined
      : new Date(props.entry.timing.entryTime),
    entryTimezone: props.entry.timing.timezone || dayjs.tz.guess(),
    logNumber: props.entry.logNumber || '',
    maxDepth: props.entry.depths?.maxDepth || '',
    avgDepth: props.entry.depths?.averageDepth || '',
    depthUnit:
      props.entry.depths?.depthUnit ||
      currentUser.user?.settings.depthUnit ||
      DepthUnit.Meters,
    notes: props.entry.notes ?? '',
    air:
      props.entry.air?.map((air) => ({
        id: uuid(),
        startPressure: air.startPressure,
        endPressure: air.endPressure,
        count: air.count,
        pressureUnit: air.pressureUnit,
        hePercent: air.hePercent ?? '',
        o2Percent: air.o2Percent ?? '',
        tankId: '',
        tankInfo: air.name
          ? {
              id: '',
              material: air.material,
              name: air.name,
              volume: air.volume,
              isSystem: false,
              workingPressure: air.workingPressure,
            }
          : undefined,
      })) ?? [],
    weather: props.entry.conditions?.weather || '',
    weight: props.entry.equipment?.weight || '',
    weightUnit:
      props.entry.equipment?.weightUnit ||
      currentUser.user?.settings.weightUnit ||
      WeightUnit.Kilograms,
    weightCorrectness: props.entry.equipment?.weightCorrectness || '',
    trim: props.entry.equipment?.trimCorrectness || '',
    exposureSuit: props.entry.equipment?.exposureSuit || '',

    airTemp: props.entry.conditions?.airTemperature || '',
    waterTemp: props.entry.conditions?.surfaceTemperature || '',
    thermocline: props.entry.conditions?.bottomTemperature || '',
    tempUnit:
      props.entry.conditions?.temperatureUnit ||
      currentUser.user?.settings.temperatureUnit ||
      TemperatureUnit.Celsius,

    chop: props.entry.conditions?.chop || 0,
    current: props.entry.conditions?.current || 0,
    visibility: props.entry.conditions?.visibility || 0,

    rating: props.entry.rating,
  };
}

const client = useClient();
const oops = useOops();
const route = useRoute();
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

const formData = reactive<LogEntryFormData>(getFormDataFromProps(props));
const formDataOld = reactive<LogEntryData>(getFormDataFromPropsOld(props));
const v$ = useVuelidate<LogEntryFormData>({}, formData);

function airFormDataToDto(air: EditEntryAirFormData): LogEntryAirDTO {
  return {
    count: typeof air.count === 'number' ? air.count : 1,
    endPressure: typeof air.endPressure === 'number' ? air.endPressure : 0,
    material: air.tankInfo?.material || TankMaterial.Aluminum,
    name: air.tankInfo?.name || '',
    pressureUnit: air.pressureUnit,
    startPressure:
      typeof air.startPressure === 'number' ? air.startPressure : 0,
    volume: air.tankInfo?.volume || 0,
    workingPressure: air.tankInfo?.workingPressure || 0,
    hePercent: typeof air.hePercent === 'number' ? air.hePercent : undefined,
    o2Percent: typeof air.o2Percent === 'number' ? air.o2Percent : undefined,
  };
}

async function onSave(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  emit('save', {
    ...props.entry,
    timing: {
      bottomTime:
        typeof formDataOld.bottomTime === 'number'
          ? formDataOld.bottomTime
          : undefined,
      duration: formDataOld.duration as number,
      entryTime: formDataOld.entryTime!.valueOf(),
      timezone: formDataOld.entryTimezone,
    },
    logNumber:
      typeof formDataOld.logNumber === 'number'
        ? formDataOld.logNumber
        : undefined,
    depths: {
      averageDepth:
        typeof formDataOld.avgDepth === 'number'
          ? formDataOld.avgDepth
          : undefined,
      maxDepth:
        typeof formDataOld.maxDepth === 'number'
          ? formDataOld.maxDepth
          : undefined,
      depthUnit: formDataOld.depthUnit,
    },
    notes: formDataOld.notes,
    site: formDataOld.site,
    air: formDataOld.air.map(airFormDataToDto),
    equipment: {
      weight:
        typeof formDataOld.weight === 'number' ? formDataOld.weight : undefined,
      weightUnit: formDataOld.weightUnit,
    },
  });
}

function onRevert() {
  state.showConfirmRevert = true;
}

function onCancelRevert() {
  state.showConfirmRevert = false;
}

function onConfirmRevert() {
  Object.assign(formDataOld, getFormDataFromPropsOld(props));
  state.showConfirmRevert = false;
}

async function getNextAvailableLogNumber(): Promise<void> {
  await oops(async () => {
    const username = route.params.username;
    if (!username || typeof username !== 'string') return;

    const nextLogNumber = await client.logEntries.getNextAvailableLogNumber(
      username,
    );
    formDataOld.logNumber = nextLogNumber;
  });
}

onMounted(async () => {
  if (formDataOld.logNumber === '') {
    await getNextAvailableLogNumber();
  }

  await oops(
    async () => {
      if (props.entry.site) {
        formDataOld.site = await client.diveSites.getDiveSite(
          props.entry.site.id,
        );
      }
    },
    {
      [404]: () => {
        // Unable to retrieve info on dive site
      },
    },
  );
});

function onAddAirEntry(newEntry: EditEntryAirFormData) {
  formDataOld.air = [...formDataOld.air, newEntry];
}

function onUpdateAirEntry(update: EditEntryAirFormData) {
  const index = formDataOld.air.findIndex((air) => air.id === update.id);
  if (index > -1) formDataOld.air[index] = update;
}

function onRemoveAirEntry(id: string) {
  const index = formDataOld.air.findIndex((air) => air.id === id);
  if (index > -1) formDataOld.air.splice(index, 1);
}

function onCloseDiveSitePanel() {
  state.showSelectDiveSite = false;
}

function onOpenDiveSitePanel() {
  state.showSelectDiveSite = true;
}

function onCloseOperatorPanel() {
  state.showSelectOperator = false;
}

function onOpenOperatorPanel() {
  state.showSelectOperator = true;
}

function onSiteSelected(site: DiveSiteDTO) {
  formDataOld.site = site;
  state.showSelectDiveSite = false;
}

function onRemoveSite() {
  formDataOld.site = undefined;
}

function onOperatorSelected(operator: OperatorDTO) {
  formDataOld.operator = operator;
  state.showSelectOperator = false;
}

function onRemoveOperator() {
  formDataOld.operator = undefined;
}
</script>
