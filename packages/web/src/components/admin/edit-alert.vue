<template>
  <TextHeading>General Properties</TextHeading>

  <FormField label="Icon" control-id="icon" required>
    <FormSelect
      v-model="data.icon"
      control-id="icon"
      test-id="icon"
      :options="IconOptions"
      autofocus
    />
  </FormField>

  <FormField control-id="title" label="Title" required>
    <FormTextBox
      v-model="data.title"
      control-id="title"
      test-id="title"
      :maxlength="200"
      autofocus
    />
  </FormField>

  <FormField label="Active">
    <FormDatePicker v-model="data.active" control-id="active" mode="datetime" />
  </FormField>
  <FormField label="Expires">
    <FormDatePicker
      v-model="data.expires"
      control-id="expires"
      mode="datetime"
    />
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
        placeholder="Enter message content. Markdown format is supported."
      />
    </div>

    <div class="h-full flex flex-col">
      <TextHeading>Preview</TextHeading>
      <MarkdownViewer
        v-model="data.message"
        class="grow rounded-md bg-secondary text-black p-2 mb-2"
      />
    </div>
  </div>

  <FormField label="JSON">
    <p class="content">
      {{ JSON.stringify(data, null, 2) }}
    </p>
  </FormField>

  <div class="text-center mt-5 space-x-3">
    <FormButton type="primary" @click="onSave">Save Alert</FormButton>
    <FormButton @click="onCancel">Cancel</FormButton>
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO } from '@bottomtime/api';

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
  active: string;
  expires: string;
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

async function onSave(): Promise<void> {}

function onCancel(): void {}
</script>
