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

  <form data-testid="edit-log-entry" @submit.prevent="">
    <fieldset class="space-y-4" :disabled="isSaving">
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
            placeholder="Select entry time"
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

        <div class="flex gap-2">
          <div class="hidden lg:block min-w-40 xl:min-w-48"></div>
          <ul
            class="italic ml-2 px-4 py-2 border-l-4 text-grey-950 border-blue-400 bg-blue-300 dark:bg-blue-800 dark:text-grey-200 rounded-r-lg w-full"
          >
            <li>
              <span class="font-bold">Duration</span>
              <span>
                is the total time you spend underwater. (From descent until you
                arrive back at the surface.)
              </span>
            </li>
            <li>
              <span class="font-bold">Bottom time</span>
              <span>
                is the time from when you start the descent until you begin your
                final ascent and safety stop.
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

      <FormField label="Gas">
        <EditEntryAir v-model="formData.air" :tanks="tanks" />
      </FormField>

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
  LogEntryAirDTO,
  LogEntryDTO,
  TankDTO,
} from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, integer, required } from '@vuelidate/validators';

import dayjs from 'dayjs';
import 'dayjs/plugin/timezone';
import { computed, onBeforeMount, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { SelectOption } from '../../common';
import { useOops } from '../../oops';
import { depth, greaterThan, lessThan } from '../../validators';
import DepthInput from '../common/depth-input.vue';
import FormButton from '../common/form-button.vue';
import FormDatePicker from '../common/form-date-picker.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import EditEntryAir from './edit-entry-air.vue';

interface EditLogbookEntryProps {
  entry: LogEntryDTO;
  isSaving?: boolean;
  tanks: TankDTO[];
}

interface EditLogbookEntryState {
  showConfirmRevert: boolean;
}

interface LogEntryData {
  bottomTime: string | number;
  duration: string | number;
  entryTime?: Date;
  entryTimezone: string;
  logNumber: string | number;
  maxDepth?: DepthDTO;
  notes: string;
  air: LogEntryAirDTO[];
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
    maxDepth: props.entry.maxDepth ? { ...props.entry.maxDepth } : undefined,
    notes: props.entry.notes ?? '',
    air: props.entry.air ?? [],
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
      positive: helpers.withMessage('Must be a valid depth', depth),
    },
  },
  formData,
);

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
    maxDepth: formData.maxDepth,
    notes: formData.notes,
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
</script>
