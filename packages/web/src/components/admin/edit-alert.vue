<template>
  <TextHeading>General Properties</TextHeading>

  <FormField
    label="Icon"
    control-id="icon"
    :invalid="v$.icon.$error"
    :error="v$.icon.$errors[0]?.$message"
    required
  >
    <FormSelect
      v-model="data.icon"
      control-id="icon"
      test-id="icon"
      :options="IconOptions"
      :invalid="v$.icon.$error"
      autofocus
    />
  </FormField>

  <FormField
    control-id="title"
    label="Title"
    :invalid="v$.title.$error"
    :error="v$.title.$errors[0]?.$message"
    required
  >
    <FormTextBox
      v-model="data.title"
      control-id="title"
      test-id="title"
      :maxlength="200"
      :invalid="v$.title.$error"
      autofocus
    />
  </FormField>

  <FormField label="Active" control-id="expires">
    <FormDatePicker v-model="data.active" control-id="active" mode="datetime" />
    <p class="text-sm italic">
      This will be the date and time at which the message will become active.
      (After which it will be shown on the home page.) Leave this blank to have
      the message become active immediately.
    </p>
  </FormField>

  <FormField
    label="Expires"
    control-id="expires"
    :invalid="v$.expires.$error"
    :error="v$.expires.$errors[0]?.$message"
  >
    <FormDatePicker
      v-model="data.expires"
      control-id="expires"
      mode="datetime"
      :invalid="v$.expires.$error"
    />
    <p class="text-sm italic">
      This will be the date and time at which the message will expire. (After
      which it will no longer be shown on the home page.) Leave this blank to
      have the message remain active until you manually remove it.
    </p>
  </FormField>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
    <div>
      <TextHeading>Content</TextHeading>
      <FormTextArea
        v-model="data.message"
        control-id="message"
        :maxlength="2000"
        :rows="10"
        resize="vertical"
        :invalid="v$.message.$error"
        placeholder="Enter message content. Markdown format is supported."
      />
      <p v-if="v$.message.$error" class="text-danger text-sm">
        {{ v$.message.$errors[0]?.$message }}
      </p>
    </div>

    <div class="h-full flex flex-col">
      <TextHeading>Preview</TextHeading>
      <MarkdownViewer
        v-model="data.message"
        class="grow rounded-md bg-secondary text-black p-2 mb-2"
      />
    </div>
  </div>

  <div class="text-center mt-5 space-x-3">
    <FormButton type="primary" @click="onSave">Save Alert</FormButton>
    <FormButton @click="onCancel">Cancel</FormButton>
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import dayjs from 'dayjs';
import { reactive } from 'vue';

import { SelectOption } from '../../common';
import FormButton from '../common/form-button.vue';
import FormDatePicker from '../common/form-date-picker.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
import MarkdownViewer from '../common/markdown-viewer.vue';
import TextHeading from '../common/text-heading.vue';

interface EditAlertProps {
  alert: AlertDTO;
}

interface EditAlertData extends Pick<AlertDTO, 'icon' | 'title' | 'message'> {
  active: string | Date;
  expires: string | Date;
}

const IconOptions: SelectOption[] = [{ value: '😀 smily' }];

const props = defineProps<EditAlertProps>();
const data = reactive<EditAlertData>({
  icon: props.alert.icon,
  title: props.alert.title,
  message: props.alert.message,
  active: '',
  expires: '',
});

function expiresAfterActive(
  expires: string,
  { active }: EditAlertData,
): boolean {
  if (!active || !expires) return true;
  return dayjs(expires).isAfter(dayjs(active));
}

const v$ = useVuelidate(
  {
    icon: { required: helpers.withMessage('Please select an icon', required) },
    title: {
      required: helpers.withMessage('Alert title is required', required),
    },
    message: {
      required: helpers.withMessage('Alert message body is required', required),
    },
    expires: {
      expiresAfterActive: helpers.withMessage(
        'Expiration date must come after activation date',
        expiresAfterActive,
      ),
    },
  },
  data,
);

async function onSave(): Promise<void> {
  await v$.value.$validate();
}

function onCancel(): void {
  // TODO: Confirmation dialog
}

function onConfirmCancel(): void {}

function onAbortCancel(): void {}
</script>
