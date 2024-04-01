<template>
  <ConfirmDialog
    :visible="showConfirmCancelDialog"
    confirm-text="Revert Changes"
    title="Revert Changes?"
    @confirm="onConfirmCancel"
    @cancel="onAbortCancel"
  >
    <div class="flex space-x-4">
      <span>
        <i class="fa-solid fa-circle-question fa-2xl"></i>
      </span>
      <div>
        <p>
          Are you sure you want to revert your changes? Any unsaved changes will
          be lost.
        </p>
      </div>
    </div>
  </ConfirmDialog>

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
      v-model.trim="data.title"
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
    <FormButton v-if="alert.id" @click="onCancel">Cancel Changes</FormButton>
    <a v-else href="/admin/alerts">
      <FormButton>Cancel</FormButton>
    </a>
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO, CreateOrUpdateAlertParamsDTO } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import dayjs from 'dayjs';
import { reactive, ref } from 'vue';

import { useClient } from '../../client';
import { SelectOption, ToastType } from '../../common';
import { useLocation } from '../../location';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import FormButton from '../common/form-button.vue';
import FormDatePicker from '../common/form-date-picker.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
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

const IconOptions: SelectOption[] = [
  { label: '😀', value: 'fa-regular fa-face-grin' },
];

const client = useClient();
const oops = useOops();
const location = useLocation();
const toasts = useToasts();

const props = defineProps<EditAlertProps>();
const emit = defineEmits<{
  (e: 'saved', alert: AlertDTO): void;
}>();
const data = reactive<EditAlertData>({
  icon: props.alert.icon,
  title: props.alert.title,
  message: props.alert.message,
  active: props.alert.active ?? '',
  expires: props.alert.expires ?? '',
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
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  await oops(async () => {
    const params: CreateOrUpdateAlertParamsDTO = {
      icon: data.icon,
      title: data.title,
      message: data.message,
      active: data.active ? dayjs(data.active).toDate() : undefined,
      expires: data.expires ? dayjs(data.expires).toDate() : undefined,
    };

    if (props.alert.id) {
      // Alert already exists, update it.
      const dto: AlertDTO = {
        id: props.alert.id,
        ...params,
      };
      const alert = client.alerts.wrapDTO(dto);
      await alert.save();
      emit('saved', dto);
      toasts.toast({
        id: 'alert-saved',
        message: 'Alert successfully saved',
        type: ToastType.Success,
      });
    } else {
      // Alert is new, create it.
      const result = await client.alerts.createAlert(params);
      location.assign(`/admin/alerts/${result.id}`);
    }
  });
}

function onCancel(): void {
  showConfirmCancelDialog.value = true;
}

function onConfirmCancel(): void {
  showConfirmCancelDialog.value = false;
  data.icon = props.alert.icon;
  data.title = props.alert.title;
  data.message = props.alert.message;
  data.active = props.alert.active ?? '';
  data.expires = props.alert.expires ?? '';
}

function onAbortCancel(): void {
  showConfirmCancelDialog.value = false;
}
</script>
