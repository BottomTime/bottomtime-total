<template>
  <ConfirmDialog
    :visible="showConfirmCancelDialog"
    confirm-text="Revert Changes"
    title="Revert Changes?"
    icon="fa-solid fa-circle-question fa-2xl"
    @confirm="onConfirmCancel"
    @cancel="onAbortCancel"
  >
    <p>
      Are you sure you want to revert your changes? Any unsaved changes will be
      lost.
    </p>
  </ConfirmDialog>

  <form data-testid="edit-alert-form" @submit.prevent="">
    <TextHeading>General</TextHeading>

    <FormField
      control-id="title"
      label="Title"
      :invalid="v$.title.$error"
      :error="v$.title.$errors[0]?.$message"
      required
    >
      <FormTextBox
        v-model.trim="data.title"
        control-id="title"
        test-id="title"
        :maxlength="200"
        :invalid="v$.title.$error"
        autofocus
      />
    </FormField>

    <FormField label="Active" control-id="expires">
      <FormDatePicker
        v-model="data.active"
        control-id="active"
        mode="datetime"
      />
      <p class="text-sm italic">
        This will be the date and time at which the message will become active.
        (After which it will be shown on the home page.) Leave this blank to
        have the message become active immediately.
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
      <p v-if="!v$.expires.$error" class="text-sm italic">
        This will be the date and time at which the message will expire. (After
        which it will no longer be shown on the home page.) Leave this blank to
        have the message remain active until you manually remove it.
      </p>
    </FormField>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div>
        <TextHeading>Content</TextHeading>
        <FormTextArea
          v-model.trim="data.message"
          control-id="message"
          test-id="message"
          :maxlength="2000"
          :rows="10"
          resize="vertical"
          :invalid="v$.message.$error"
          placeholder="Enter message content. Markdown format is supported."
        />
        <p
          v-if="v$.message.$error"
          class="text-danger text-sm"
          data-testid="message-error"
        >
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
      <FormButton type="primary" test-id="btn-save" @click="onSave">
        Save Alert
      </FormButton>
      <FormButton v-if="alert.id" test-id="btn-cancel-edit" @click="onCancel">
        Cancel Changes
      </FormButton>
      <a v-else href="/admin/alerts">
        <FormButton test-id="btn-cancel-new">Cancel</FormButton>
      </a>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { AlertDTO } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import dayjs from 'src/dayjs';
import { reactive, ref } from 'vue';

import FormButton from '../common/form-button.vue';
import FormDatePicker from '../common/form-date-picker.vue';
import FormField from '../common/form-field.vue';
import FormTextArea from '../common/form-text-area.vue';
import FormTextBox from '../common/form-text-box.vue';
import MarkdownViewer from '../common/markdown-viewer.vue';
import TextHeading from '../common/text-heading.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';

interface EditAlertProps {
  alert: AlertDTO;
}

interface EditAlertData extends Pick<AlertDTO, 'icon' | 'title' | 'message'> {
  active: string | Date;
  expires: string | Date;
}

const props = defineProps<EditAlertProps>();
const emit = defineEmits<{
  (e: 'save', alert: AlertDTO): void;
}>();
const data = reactive<EditAlertData>({
  icon: '',
  title: props.alert.title,
  message: props.alert.message,
  active: props.alert.active ? new Date(props.alert.active) : '',
  expires: props.alert.expires ? new Date(props.alert.expires) : '',
});
const showConfirmCancelDialog = ref(false);

function expiresAfterActive(
  expires: string,
  { active }: EditAlertData,
): boolean {
  if (!active || !expires) return true;
  return dayjs(expires).isAfter(dayjs(active));
}

const v$ = useVuelidate(
  {
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
  const isValid = await v$.value.$validate();
  if (isValid) {
    emit('save', {
      id: props.alert.id,
      icon: data.icon,
      title: data.title,
      message: data.message,
      active: data.active ? dayjs(data.active).valueOf() : undefined,
      expires: data.expires ? dayjs(data.expires).valueOf() : undefined,
    });
  }
}

function onCancel(): void {
  showConfirmCancelDialog.value = true;
}

function onConfirmCancel(): void {
  showConfirmCancelDialog.value = false;
  data.icon = props.alert.icon;
  data.title = props.alert.title;
  data.message = props.alert.message;
  data.active = props.alert.active ? new Date(props.alert.active) : '';
  data.expires = props.alert.expires ? new Date(props.alert.expires) : '';
}

function onAbortCancel(): void {
  showConfirmCancelDialog.value = false;
}
</script>
