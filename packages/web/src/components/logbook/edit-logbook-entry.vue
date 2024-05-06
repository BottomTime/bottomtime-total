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
        <FormTextBox
          v-model.number="formData.logNumber"
          control-id="logNumber"
          test-id="log-number"
          autofocus
          :invalid="v$.logNumber.$error"
        />
      </FormField>

      <FormField
        label="Entry Time"
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
          />

          <FormSelect
            v-model="formData.entryTimezone"
            control-id="entryTime"
            mode="datetime"
            placeholder="Select entry time"
            :options="timezones"
          />
        </div>
      </FormField>

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

      <FormField
        label="Max depth"
        :invalid="v$.maxDepth.$error"
        :error="v$.maxDepth.$errors[0]?.$message"
      >
        <DepthInput v-model="formData.maxDepth" :invalid="v$.maxDepth.$error" />
      </FormField>

      <FormField label="Notes" control-id="notes">
        <FormTextArea
          v-model="formData.notes"
          control-id="notes"
          test-id="notes"
        />
      </FormField>

      <div class="flex justify-center gap-3">
        <FormButton
          type="primary"
          :is-loading="isSaving"
          submit
          @click="onSave"
        >
          Save Changes
        </FormButton>
        <FormButton @click="onRevert">Cancel</FormButton>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { DepthDTO, LogEntryDTO } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, integer, required } from '@vuelidate/validators';

import dayjs from 'dayjs';
import 'dayjs/plugin/timezone';
import { computed, reactive } from 'vue';

import { SelectOption } from '../../common';
import { depth, greaterThan, lessThan, maxDate } from '../../validators';
import DepthInput from '../common/depth-input.vue';
import FormButton from '../common/form-button.vue';
import FormDatePicker from '../common/form-date-picker.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';

interface EditLogbookEntryProps {
  entry: LogEntryDTO;
  isSaving?: boolean;
}

interface EditLogbookEntryState {
  showConfirmRevert: boolean;
}

interface LogEntryData {
  bottomTime: string | number;
  duration: string | number;
  entryTime: Date;
  entryTimezone: string;
  logNumber: string | number;
  maxDepth?: DepthDTO;
  notes: string;
}

function getFormDataFromProps(props: EditLogbookEntryProps): LogEntryData {
  return {
    bottomTime: '',
    duration: '',
    entryTime: new Date(props.entry.entryTime.date),
    entryTimezone: props.entry.entryTime.timezone || dayjs.tz.guess(),
    logNumber: props.entry.logNumber || '',
    maxDepth: props.entry.maxDepth,
    notes: props.entry.notes ?? '',
  };
}

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
      maxDate: helpers.withMessage(
        'Entry time cannot be in the future',
        maxDate(),
      ),
    },
    logNumber: {
      integer: helpers.withMessage('Log number must be an integer', integer),
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
</script>
