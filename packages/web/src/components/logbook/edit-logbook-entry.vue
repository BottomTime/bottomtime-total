<template>
  <ConfirmDialog
    :visible="state.showConfirmRevert"
    title="Revert changes?"
    confirm-text="Revert"
    @confirm="onConfirmRevert"
    @cancel="onCancelRevert"
  >
    <div class="flex gap-3">
      <span>
        <i class="fa-regular fa-circle-question fa-2x"></i>
      </span>

      <div class="space-y-2">
        <p>
          Are you sure you want to revert your unsaved changes? The log entry
          will be restored to the state that is currently saved.
        </p>

        <p>This cannot be undone.</p>
      </div>
    </div>
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
      <TextHeading>Basic Info</TextHeading>
      <section class="ml-3 lg:ml-0">
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
          <div class="flex flex-col gap-2 md:flex-row md:gap-3 items-baseline">
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

        <div>
          <div
            class="flex flex-col gap-0 justify-start md:flex-row md:gap-6 md:justify-stretch"
          >
            <FormField
              class="grow"
              label="Duration"
              control-id="duration"
              :invalid="v$.duration.$error"
              :error="v$.duration.$errors[0]?.$message"
              required
            >
              <div class="relative">
                <FormTextBox
                  v-model.number="formData.duration"
                  control-id="duration"
                  test-id="duration"
                  :maxlength="10"
                  :invalid="v$.duration.$error"
                />
                <span
                  class="absolute end-0 inset-y-0 font-bold text-grey-200 bg-grey-700 border border-grey-950 dark:text-grey-200 dark:bg-grey-700 rounded-r-lg flex justify-center items-center w-10 pointer-events-none"
                >
                  mins
                </span>
              </div>
            </FormField>

            <FormField
              class="grow"
              label="Bottom time"
              control-id="bottomTime"
              :invalid="v$.bottomTime.$error"
              :error="v$.bottomTime.$errors[0]?.$message"
            >
              <div class="relative">
                <FormTextBox
                  v-model.number="formData.bottomTime"
                  control-id="bottomTime"
                  test-id="bottomTime"
                  :maxlength="10"
                  :invalid="v$.bottomTime.$error"
                />
                <span
                  class="absolute end-0 inset-y-0 font-bold text-grey-200 bg-grey-700 border border-grey-950 dark:text-grey-200 dark:bg-grey-700 rounded-r-lg flex justify-center items-center w-10 pointer-events-none"
                >
                  mins
                </span>
              </div>
            </FormField>
          </div>

          <div class="flex gap-2 mb-3">
            <div class="hidden lg:block min-w-40 xl:min-w-48"></div>
            <ul
              class="italic ml-2 px-4 py-2 border-l-4 text-grey-950 border-blue-400 bg-blue-300 dark:bg-blue-800 dark:text-grey-200 rounded-r-lg w-full"
            >
              <li>
                <span class="font-bold">Duration</span>
                <span>
                  is the total time you spend underwater. (From descent until
                  you arrive back at the surface.)
                </span>
              </li>
              <li>
                <span class="font-bold">Bottom time</span>
                <span>
                  is the time from when you start the descent until you begin
                  your final ascent and safety stop.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <FormField
          label="Max depth"
          control-id="maxDepth"
          :invalid="v$.maxDepth.$error"
          :error="v$.maxDepth.$errors[0]?.$message"
        >
          <DepthInput
            v-model="formData.maxDepth"
            control-id="maxDepth"
            test-id="max-depth"
            :invalid="v$.maxDepth.$error"
          />
        </FormField>
      </section>

      <!-- Dive Site -->
      <TextHeading>Location</TextHeading>
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

      <!-- Gas -->
      <TextHeading>Gas</TextHeading>
      <FormField>
        <EditEntryAirCollection
          :air="formData.air"
          :tanks="tanks"
          @add="onAddAirEntry"
          @update="onUpdateAirEntry"
          @remove="onRemoveAirEntry"
        />
      </FormField>

      <!-- Equipment -->
      <TextHeading>Equipment</TextHeading>
      <FormField
        label="Weights"
        control-id="weights"
        :invalid="v$.weights.$error"
        :error="v$.weights.$errors[0]?.$message"
      >
        <WeightInput
          v-model="formData.weights"
          control-id="weights"
          test-id="weights"
          :invalid="v$.weights.$error"
        />
      </FormField>

      <TextHeading>Other Info</TextHeading>
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

      <TextHeading>Save</TextHeading>
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
  DepthDTO,
  DiveSiteDTO,
  LogEntryAirDTO,
  LogEntryDTO,
  TankDTO,
  TankMaterial,
  WeightDTO,
} from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, integer, required } from '@vuelidate/validators';

import dayjs from 'dayjs';
import 'dayjs/plugin/timezone';
import { v4 as uuid } from 'uuid';
import { computed, onBeforeMount, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { SelectOption } from '../../common';
import { useOops } from '../../oops';
import { depth, greaterThan, lessThan, weight } from '../../validators';
import DepthInput from '../common/depth-input.vue';
import DrawerPanel from '../common/drawer-panel.vue';
import FormButton from '../common/form-button.vue';
import FormDatePicker from '../common/form-date-picker.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
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
  entryTime?: Date;
  entryTimezone: string;
  logNumber: string | number;
  maxDepth: DepthDTO | string;
  notes: string;
  air: EditEntryAirFormData[];
  site?: DiveSiteDTO;
  weights: WeightDTO | string;
}

function getFormDataFromProps(props: EditLogbookEntryProps): LogEntryData {
  return {
    bottomTime: props.entry.bottomTime ?? '',
    duration: props.entry.duration === -1 ? '' : props.entry.duration,
    entryTime: props.entry.entryTime.date
      ? new Date(props.entry.entryTime.date)
      : undefined,
    entryTimezone: props.entry.entryTime.timezone || dayjs.tz.guess(),
    logNumber: props.entry.logNumber || '',
    maxDepth: props.entry.maxDepth ? { ...props.entry.maxDepth } : '',
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
    weights: props.entry.weights ? { ...props.entry.weights } : '',
  };
}

const client = useClient();
const oops = useOops();
const route = useRoute();

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
    weights: {
      valid: helpers.withMessage(
        'Weight must be numeric and cannot be less than zero',
        weight,
      ),
    },
  },
  formData,
);

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
    bottomTime:
      typeof formData.bottomTime === 'number' ? formData.bottomTime : undefined,
    duration: formData.duration as number,
    entryTime: {
      date: dayjs(formData.entryTime).format('YYYY-MM-DDTHH:mm:ss'),
      timezone: formData.entryTimezone,
    },
    logNumber:
      typeof formData.logNumber === 'number' ? formData.logNumber : undefined,
    maxDepth:
      typeof formData.maxDepth === 'object' ? formData.maxDepth : undefined,
    notes: formData.notes,
    site: formData.site,
    air: formData.air.map(airFormDataToDto),
    weights:
      typeof formData.weights === 'object' ? formData.weights : undefined,
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

function onSiteSelected(site: DiveSiteDTO) {
  formData.site = site;
  state.showSelectDiveSite = false;
}
</script>
