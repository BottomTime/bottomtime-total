<template>
  <TextHeading>General Properties</TextHeading>

  <FormField label="Icon" required></FormField>

  <FormField control-id="title" label="Title" required>
    <FormTextBox
      control-id="title"
      test-id="title"
      :maxlength="200"
      autofocus
    />
  </FormField>

  <FormField label="Active"></FormField>
  <FormField label="Expires"></FormField>

  <TextHeading>Content</TextHeading>

  <div class="grid grid-cols-2 gap-4">
    <FormTextArea
      v-model="data.message"
      control-id="message"
      :maxlength="2000"
      :rows="10"
      placeholder="Enter message content. Markdown format is supported."
    />
    <MarkdownViewer v-model="data.message" />
  </div>

  <div class="text-center mt-5 space-x-3">
    <FormButton type="primary" @click="onSave">Save Alert</FormButton>
    <FormButton @click="onCancel">Cancel</FormButton>
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO } from '@bottomtime/api';

import { reactive } from 'vue';

import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
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
