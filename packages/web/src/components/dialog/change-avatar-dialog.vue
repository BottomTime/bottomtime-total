<template>
  <DialogBase
    size="lg"
    title="Select Avatar"
    :visible="visible"
    @close="$emit('cancel')"
  >
    <template #default>
      <!-- Show image cropper if we have a URL -->
      <ImageCropper
        v-if="avatarUrl"
        :image="avatarUrl"
        :target-width="512"
        circle
      />

      <!-- Otherwise, show a drag-and-drop target -->
      <FileUpload v-else accept="image/*" />
    </template>

    <template #buttons>
      <FormButton v-if="avatarUrl" type="primary" disabled @click="onSave">
        Save
      </FormButton>
      <FormButton @click="$emit('cancel')"> Cancel </FormButton>
    </template>
  </DialogBase>
</template>

<script setup lang="ts">
import FileUpload from '../common/file-upload.vue';
import FormButton from '../common/form-button.vue';
import ImageCropper from '../common/image-cropper.vue';
import DialogBase from './dialog-base.vue';

type ChangeAvatarDialogProps = {
  avatarUrl?: string;
  visible?: boolean;
};

withDefaults(defineProps<ChangeAvatarDialogProps>(), {
  visible: false,
});

const emit = defineEmits<{
  (e: 'save', avatarUrl: string): void;
  (e: 'cancel'): void;
}>();

function onSave() {
  emit('save', '');
}
</script>
