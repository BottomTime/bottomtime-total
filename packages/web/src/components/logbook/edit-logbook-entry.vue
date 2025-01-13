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
    <SelectSite :current-site="formData.site" @site-selected="onSiteSelected" />
  </DrawerPanel>

  <form data-testid="edit-log-entry" @submit.prevent="">
    <fieldset class="space-y-4" :disabled="isSaving">
      <!-- Basic Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section
          class="border-2 border-secondary p-2 rounded-md space-y-3 px-6"
        >
          <TextHeading class="-ml-3" level="h2">Basic Info</TextHeading>

          <FormField
            label="Log #"
            control-id="logNumber"
            :invalid="v$.logNumber.$error"
            :error="v$.logNumber.$errors[0]?.$message"
          >
            <div class="relative">
              <FormTextBox
                v-model.number="formData.logNumber"
                control-id="logNumber"
                test-id="log-number"
                autofocus
                :invalid="v$.logNumber.$error"
              />
              <button
                class="absolute inset-y-0 end-0 rounded-r-lg border border-grey-950 flex justify-center items-center px-2 text-grey-950 disabled:text-grey-500 bg-secondary hover:bg-secondary-hover"
                data-testid="get-next-log-number"
                @click="getNextAvailableLogNumber"
              >
                Use Next Available Number
              </button>
            </div>
          </FormField>

          <FormField
            label="Entry Time"
            control-id="dp-input-entryTime"
            required
            :invalid="v$.entryTime.$error"
            :error="v$.entryTime.$errors[0]?.$message"
          >
            <div
              class="flex flex-col gap-2 md:flex-row md:gap-3 items-baseline"
            >
              <FormDatePicker
                v-model="formData.entryTime"
                control-id="entryTime"
                mode="datetime"
                placeholder="Select entry time"
                :invalid="v$.entryTime.$error"
                :max-date="dayjs().endOf('day').toDate()"
              />

              <FormSelect
                v-model="formData.entryTimezone"
                control-id="entryTimeTimezone"
                test-id="entry-time-timezone"
                mode="datetime"
                placeholder="Select timezone"
                :options="timezones"
              />
            </div>
          </FormField>

          <div class="flex flex-col md:flex-row gap-2 justify-between">
            <FormField
              class="grow"
              label="Duration"
              control-id="duration"
              :invalid="v$.duration.$error"
              :error="v$.duration.$errors[0]?.$message"
              required
            >
              <DurationInput
                v-model="formData.duration"
                control-id="duration"
                test-id="duration"
                :invalid="v$.duration.$error"
              />
            </FormField>

            <FormField
              class="grow"
              label="Bottom time"
              control-id="bottomTime"
              :invalid="v$.bottomTime.$error"
              :error="v$.bottomTime.$errors[0]?.$message"
            >
              <DurationInput
                v-model="formData.bottomTime"
                control-id="bottomTime"
                test-id="bottomTime"
                :invalid="v$.bottomTime.$error"
              />
            </FormField>

            <FormField
              class="grow"
              label="Surface Interval"
              control-id="surfaceInterval"
              :invalid="v$.surfaceInterval.$error"
              :error="v$.surfaceInterval.$errors[0]?.$message"
            >
              <DurationInput
                v-model="formData.surfaceInterval"
                control-id="surfaceInterval"
                test-id="surfaceInterval"
                :invalid="v$.surfaceInterval.$error"
                disabled
              />
            </FormField>
          </div>

          <ul
            class="-mt-3 mx-8 text-xs px-2 py-1 border-l-4 text-grey-950 border-blue-400 bg-blue-300 dark:bg-blue-800 dark:text-grey-200 rounded-r-lg"
          >
            <li class="text-md font-bold">Hint:</li>
            <li>
              <span class="font-bold">Duration</span>
              <span class="italic">
                is the total time you spend underwater. (From descent until you
                arrive back at the surface.)
              </span>
            </li>
            <li>
              <span class="font-bold">Bottom time</span>
              <span class="italic">
                is the time from when you start the descent until you begin your
                final ascent and safety stop.
              </span>
            </li>
          </ul>

          <div class="flex flex-col md:flex-row gap-2 justify-between">
            <FormField
              class="grow"
              label="Max depth"
              control-id="maxDepth"
              :invalid="v$.maxDepth.$error"
              :error="v$.maxDepth.$errors[0]?.$message"
            >
              <DepthInput
                v-model="formData.maxDepth"
                control-id="maxDepth"
                test-id="max-depth"
                :unit="formData.depthUnit"
                :invalid="v$.maxDepth.$error"
                @toggle-unit="onToggleDepthUnit"
              />
            </FormField>

            <FormField
              class="grow"
              label="Average depth"
              control-id="avgDepth"
              :invalid="v$.avgDepth.$error"
              :error="v$.avgDepth.$errors[0]?.$message"
            >
              <DepthInput
                v-model="formData.avgDepth"
                control-id="avgDepth"
                test-id="avg-depth"
                :unit="formData.depthUnit"
                :invalid="v$.avgDepth.$error"
                @toggle-unit="onToggleDepthUnit"
              />
            </FormField>
          </div>
        </section>

        <!-- Dive Site -->
        <section
          class="border-2 border-secondary p-2 rounded-md space-y-3 px-6"
        >
          <TextHeading class="-ml-3" level="h2">Location</TextHeading>
          <FormField>
            <div v-if="formData.site" class="space-y-2">
              <PreviewDiveSite :site="formData.site" />
              <FormButton
                type="link"
                size="md"
                test-id="btn-change-site"
                @click="onOpenDiveSitePanel"
              >
                Change site...
              </FormButton>
            </div>

            <FormButton
              v-else
              test-id="btn-select-site"
              @click="onOpenDiveSitePanel"
            >
              Select Dive Site...
            </FormButton>
          </FormField>
        </section>

        <!-- Dive Conditions -->
        <section
          class="border-2 border-secondary p-2 rounded-md space-y-3 px-6"
        >
          <TextHeading class="-ml-3" level="h2">Conditions</TextHeading>

          <FormField label="Weather" control-id="weather">
            <FormSelect
              v-model="formData.weather"
              control-id="weather"
              test-id="weather"
              :options="WeatherOptions"
              stretch
            />
          </FormField>

          <div class="flex flex-col md:flex-row gap-2 justify-between">
            <FormField label="Air Temp">
              <TemperatureInput
                v-model.number="formData.airTemp"
                :unit="formData.tempUnit"
                @toggle-unit="onToggleTempUnit"
              />
            </FormField>

            <FormField label="Water Temp">
              <TemperatureInput
                v-model.number="formData.waterTemp"
                :unit="formData.tempUnit"
                @toggle-unit="onToggleTempUnit"
              />
            </FormField>

            <FormField label="Thermocline">
              <TemperatureInput
                v-model.number="formData.thermocline"
                :unit="formData.tempUnit"
                @toggle-unit="onToggleTempUnit"
              />
            </FormField>
          </div>

          <FormField label="Current">
            <div class="flex gap-2 items-center">
              <FormSlider
                v-model="formData.current"
                :min="0"
                :show-value="false"
              />
              <span class="min-w-24">{{ currentText }}</span>
            </div>
          </FormField>

          <FormField label="Visibility">
            <div class="flex gap-2 items-center">
              <FormSlider
                v-model="formData.visibility"
                :min="0"
                :show-value="false"
              />
              <span class="min-w-24">{{ visibilityText }}</span>
            </div>
          </FormField>

          <FormField label="Chop">
            <div class="flex gap-2 items-center">
              <FormSlider
                v-model="formData.chop"
                :min="0"
                :show-value="false"
              />
              <span class="min-w-24">{{ chopText }}</span>
            </div>
          </FormField>
        </section>

        <!-- Breathing Gas -->
        <section
          class="border-2 border-secondary p-2 rounded-md space-y-3 px-6"
        >
          <TextHeading class="-ml-3" level="h2">Breathing Gas</TextHeading>

          <FormField>
            <EditEntryAirCollection
              :air="formData.air"
              :tanks="tanks"
              @add="onAddAirEntry"
              @update="onUpdateAirEntry"
              @remove="onRemoveAirEntry"
            />
          </FormField>
        </section>

        <!-- Equipment -->
        <section
          class="border-2 border-secondary p-2 rounded-md space-y-3 px-6"
        >
          <TextHeading class="-ml-3" level="h2">Equipment</TextHeading>

          <FormField
            label="Weight"
            control-id="weight"
            :invalid="v$.weight.$error"
          >
            <WeightInput
              v-model="formData.weight"
              :unit="formData.weightUnit"
              control-id="weight"
              test-id="weight"
              :invalid="v$.weight.$error"
              @toggle-unit="onToggleWeightUnit"
            />
          </FormField>

          <div class="flex flex-col md:flex-row gap-2 justify-between">
            <FormField label="Weight Accuracy" control-id="weightCorrectness">
              <FormSelect
                v-model="formData.weightCorrectness"
                control-id="weightCorrectness"
                test-id="weight-correctness"
                :options="WeightAccuracyOptions"
              />
            </FormField>

            <FormField label="Trim" control-id="trim">
              <FormSelect
                v-model="formData.trim"
                control-id="trim"
                test-id="trim"
                :options="TrimOptions"
              />
            </FormField>
          </div>

          <FormField label="Exposure Suit" control-id="exposureSuit">
            <FormSelect
              v-model="formData.exposureSuit"
              control-id="exposureSuit"
              test-id="exposureSuit"
              :options="ExposureSuitOptions"
              stretch
            />
          </FormField>

          <FormField label="Other Equipment:">
            <div class="grid grid-cols-2">
              <FormCheckbox v-model="formData.boots">Boots</FormCheckbox>
              <FormCheckbox v-model="formData.camera">Camera</FormCheckbox>
              <FormCheckbox v-model="formData.hood">Hood</FormCheckbox>
              <FormCheckbox v-model="formData.gloves">Gloves</FormCheckbox>
              <FormCheckbox v-model="formData.scooter">Scooter</FormCheckbox>
              <FormCheckbox v-model="formData.torch">Torch</FormCheckbox>
            </div>
          </FormField>
        </section>

        <!-- Notes -->
        <section
          class="border-2 border-secondary p-2 rounded-md space-y-3 px-6"
        >
          <TextHeading class="-ml-3" level="h2">Notes</TextHeading>

          <FormField control-id="notes">
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
  ExposureSuit,
  LogEntryAirDTO,
  LogEntryDTO,
  SuccinctDiveSiteDTO,
  TankDTO,
  TankMaterial,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, integer, minValue, required } from '@vuelidate/validators';

import dayjs from 'dayjs';
import 'dayjs/plugin/timezone';
import { v7 as uuid } from 'uuid';
import { computed, onBeforeMount, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { SelectOption } from '../../common';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';
import { depth, greaterThan, lessThan, weight } from '../../validators';
import DepthInput from '../common/depth-input.vue';
import DrawerPanel from '../common/drawer-panel.vue';
import DurationInput from '../common/duration-input.vue';
import FormButton from '../common/form-button.vue';
import FormCheckbox from '../common/form-checkbox.vue';
import FormDatePicker from '../common/form-date-picker.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormSlider from '../common/form-slider.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
import StarRating from '../common/star-rating.vue';
import TemperatureInput from '../common/temperature-input.vue';
import TextHeading from '../common/text-heading.vue';
import WeightInput from '../common/weight-input.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import PreviewDiveSite from '../diveSites/preview-dive-site.vue';
import SelectSite from '../diveSites/selectSite/select-site.vue';
import EditEntryAirCollection from './edit-entry-air-collection.vue';
import { EditEntryAirFormData } from './edit-entry-air-form-data';

interface EditLogbookEntryProps {
  entry: LogEntryDTO;
  isSaving?: boolean;
  tanks: TankDTO[];
}

interface EditLogbookEntryState {
  showConfirmRevert: boolean;
  showSelectDiveSite: boolean;
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
  site?: SuccinctDiveSiteDTO;
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

const WeatherOptions: SelectOption[] = [
  { label: '(Unspecified)', value: '' },
  { label: '☀️ Sunny', value: 'Sunny' },
  { label: '🌤️ Partly cloudy', value: 'Partly cloudy' },
  { label: '☁️ Overcast', value: 'Overcast' },
  { label: '🌧️ Raining', value: 'Light rain' },
  { label: '⛈️ Stormy', value: 'Stormy' },
  { label: '🌨️ Snowing', value: 'Snowing' },
];

const WeightAccuracyOptions: SelectOption[] = [
  { label: '(Unspecified)', value: '' },
  { label: 'Good', value: WeightCorrectness.Good },
  { label: 'Too much', value: WeightCorrectness.Over },
  { label: 'Too little', value: WeightCorrectness.Under },
];

const TrimOptions: SelectOption[] = [
  { label: '(Unspecified)', value: '' },
  { label: 'Good', value: TrimCorrectness.Good },
  { label: 'Head down', value: TrimCorrectness.HeadDown },
  { label: 'Knees down', value: TrimCorrectness.KneesDown },
];

const ExposureSuitOptions: SelectOption[] = [
  { label: '(Unspecified)', value: '' },
  { label: 'None', value: ExposureSuit.None },
  { label: 'Shorty', value: ExposureSuit.Shorty },
  { label: 'Rashguard', value: ExposureSuit.Rashguard },
  { label: 'Wetsuit (3mm)', value: ExposureSuit.Wetsuit3mm },
  { label: 'Wetsuit (5mm)', value: ExposureSuit.Wetsuit5mm },
  { label: 'Wetsuit (7mm)', value: ExposureSuit.Wetsuit7mm },
  { label: 'Wetsuit (9mm)', value: ExposureSuit.Wetsuit9mm },
  { label: 'Drysuit', value: ExposureSuit.Drysuit },
  { label: 'Other', value: ExposureSuit.Other },
];

function getFormDataFromProps(props: EditLogbookEntryProps): LogEntryData {
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
    site: props.entry.site,
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

const timezones = computed<SelectOption[]>(() =>
  Intl.supportedValuesOf('timeZone').map((tz) => ({
    label: tz,
    value: tz,
  })),
);

const props = withDefaults(defineProps<EditLogbookEntryProps>(), {
  isSaving: false,
});
const emit = defineEmits<{
  (e: 'save', data: LogEntryDTO): void;
}>();

const state = reactive<EditLogbookEntryState>({
  showConfirmRevert: false,
  showSelectDiveSite: false,
});

const formData = reactive<LogEntryData>(getFormDataFromProps(props));
const v$ = useVuelidate<LogEntryData>(
  {
    bottomTime: {
      positive: helpers.withMessage(
        'Bottom time must be a positive number',
        greaterThan(0),
      ),
      lessThanDuration: helpers.withMessage(
        'Bottom time must be less than duration',
        (val, others) => lessThan(others.duration || Infinity)(val),
      ),
    },
    duration: {
      required: helpers.withMessage('Duration is required', required),
      positive: helpers.withMessage(
        'Duration must be a positive number',
        greaterThan(0),
      ),
    },
    surfaceInterval: {
      positive: helpers.withMessage(
        'Surface interval time must be a positive number',
        minValue(0),
      ),
    },
    entryTime: {
      required: helpers.withMessage('Entry time is required', required),
    },
    logNumber: {
      integer: helpers.withMessage(
        'Log number must be a positive integer',
        integer,
      ),
      positive: helpers.withMessage(
        'Log number must be a positive number',
        greaterThan(0),
      ),
    },
    maxDepth: {
      positive: helpers.withMessage(
        'Depth must be numeric and greater than zero',
        depth,
      ),
    },
    avgDepth: {
      positive: helpers.withMessage(
        'Depth must be numeric and greater than zero',
        depth,
      ),
      lessThanMaxDepth: helpers.withMessage(
        'Average depth must be less than max depth',
        (val, others) => lessThan(others.maxDepth || Infinity)(val),
      ),
    },
    weight: {
      valid: helpers.withMessage(
        'Weight must be numeric and cannot be less than zero',
        (val) => weight({ weight: val, unit: formData.weightUnit }),
      ),
    },
  },
  formData,
);

const currentText = computed(() => {
  const value = Math.round(formData.current);

  if (value === 1) return 'None';
  if (value === 2) return 'Light';
  if (value === 3) return 'Moderate';
  if (value === 4) return 'Strong';
  if (value === 5) return 'Extreme';

  return 'Unspecified';
});

const visibilityText = computed(() => {
  const value = Math.round(formData.visibility);

  if (value === 1) return 'Nil';
  if (value === 2) return 'Poor';
  if (value === 3) return 'Fair';
  if (value === 4) return 'Good';
  if (value === 5) return 'Excellent';

  return 'Unspecified';
});

const chopText = computed(() => {
  const value = Math.round(formData.chop ?? 0);

  if (value === 1) return 'Calm';
  if (value === 2) return 'Light';
  if (value === 3) return 'Moderate';
  if (value === 4) return 'Heavy';
  if (value === 5) return 'Severe';

  return 'Unspecified';
});

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
        typeof formData.bottomTime === 'number'
          ? formData.bottomTime
          : undefined,
      duration: formData.duration as number,
      entryTime: formData.entryTime!.valueOf(),
      timezone: formData.entryTimezone,
    },
    logNumber:
      typeof formData.logNumber === 'number' ? formData.logNumber : undefined,
    depths: {
      averageDepth:
        typeof formData.avgDepth === 'number' ? formData.avgDepth : undefined,
      maxDepth:
        typeof formData.maxDepth === 'number' ? formData.maxDepth : undefined,
      depthUnit: formData.depthUnit,
    },
    notes: formData.notes,
    site: formData.site,
    air: formData.air.map(airFormDataToDto),
    equipment: {
      weight: typeof formData.weight === 'number' ? formData.weight : undefined,
      weightUnit: formData.weightUnit,
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
  Object.assign(formData, getFormDataFromProps(props));
  state.showConfirmRevert = false;
}

async function getNextAvailableLogNumber(): Promise<void> {
  await oops(async () => {
    const username = route.params.username;
    if (!username || typeof username !== 'string') return;

    const nextLogNumber = await client.logEntries.getNextAvailableLogNumber(
      username,
    );
    formData.logNumber = nextLogNumber;
  });
}

onBeforeMount(async () => {
  if (formData.logNumber === '') {
    await getNextAvailableLogNumber();
  }
});

function onAddAirEntry(newEntry: EditEntryAirFormData) {
  formData.air = [...formData.air, newEntry];
}

function onUpdateAirEntry(update: EditEntryAirFormData) {
  const index = formData.air.findIndex((air) => air.id === update.id);
  if (index > -1) formData.air[index] = update;
}

function onRemoveAirEntry(id: string) {
  const index = formData.air.findIndex((air) => air.id === id);
  if (index > -1) formData.air.splice(index, 1);
}

function onCloseDiveSitePanel() {
  state.showSelectDiveSite = false;
}

function onOpenDiveSitePanel() {
  state.showSelectDiveSite = true;
}

function onSiteSelected(site: SuccinctDiveSiteDTO) {
  formData.site = site;
  state.showSelectDiveSite = false;
}

function onToggleTempUnit(newUnit: TemperatureUnit) {
  formData.tempUnit = newUnit;
}

function onToggleDepthUnit(newUnit: DepthUnit) {
  formData.depthUnit = newUnit;
}

function onToggleWeightUnit(newUnit: WeightUnit) {
  formData.weightUnit = newUnit;
}
</script>
