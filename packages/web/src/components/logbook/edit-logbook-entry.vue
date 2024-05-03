<template>
  <ConfirmDialog
    :visible="state.showConfirmRevert"
    title="Revert changes?"
    confirm-text="Revert"
    @confirm="onConfirmRevert"
    @cancel="onCancelRevert"
  >
    <span>U sure?</span>
  </ConfirmDialog>

  <form data-testid="edit-log-entry" @submit.prevent="">
    <fieldset :disabled="isSaving">
      <FormField label="Log #" control-id="logNumber">
        <FormTextBox
          v-model.number="formData.logNumber"
          control-id="logNumber"
          test-id="log-number"
          autofocus
        />
      </FormField>

      <FormField label="Entry Time" required>
        <div class="flex gap-3 items-baseline">
          <FormDatePicker
            v-model="formData.entryTime"
            control-id="entryTime"
            mode="datetime"
            placeholder="Select entry time"
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

      <FormField label="Max depth">
        <DepthInput v-model="formData.maxDepth" />
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

import dayjs from 'dayjs';
import 'dayjs/plugin/timezone';
import { computed, reactive } from 'vue';

import { SelectOption } from '../../common';
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
  entryTime: Date;
  entryTimezone: string;
  logNumber: number | undefined;
  maxDepth?: DepthDTO;
  notes: string;
}

function getFormDataFromProps(props: EditLogbookEntryProps): LogEntryData {
  return {
    entryTime: new Date(props.entry.entryTime.date),
    entryTimezone: props.entry.entryTime.timezone || dayjs.tz.guess(),
    logNumber: props.entry.logNumber,
    maxDepth: props.entry.maxDepth,
    notes: props.entry.notes ?? '',
  };
}

const timezones = computed<SelectOption[]>(() => {
  return [
    { label: '(Select timezone)', value: '' },
    ...Intl.supportedValuesOf('timeZone').map((tz) => ({
      label: tz,
      value: tz,
    })),
  ];
});

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

function onSave() {
  emit('save', {
    ...props.entry,
    entryTime: {
      date: dayjs(formData.entryTime).format('YYYY-MM-DDTHH:mm:ss'),
      timezone: formData.entryTimezone,
    },
    logNumber: formData.logNumber,
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
