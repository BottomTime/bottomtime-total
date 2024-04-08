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
        v-if="imageUrl"
        class="w-full h-[400px]"
        default-boundaries="fill"
        :image="imageUrl"
        :target-width="512"
        circle
        @change="onImageCropperChange"
      />

      <!-- Otherwise, show a drag-and-drop target -->
      <FileUpload v-else accept="image/*" @change="onFileSelect" />
    </template>

    <template #buttons>
      <FormButton
        v-if="imageUrl && coordinates"
        type="primary"
        :is-loading="isSaving"
        @click="onSave"
      >
        Save
      </FormButton>

      <FormButton
        v-if="imageUrl && coordinates"
        :disabled="isSaving"
        @click="onChangeImage"
      >
        Change Image
      </FormButton>

      <FormButton :disabled="isSaving" @click="$emit('cancel')">
        Cancel
      </FormButton>
    </template>
  </DialogBase>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { Coordinates } from '../../common';
import FileUpload from '../common/file-upload.vue';
import FormButton from '../common/form-button.vue';
import ImageCropper from '../common/image-cropper.vue';
import DialogBase from './dialog-base.vue';

type ChangeAvatarDialogProps = {
  avatarUrl?: string;
  isSaving?: boolean;
  visible?: boolean;
};

withDefaults(defineProps<ChangeAvatarDialogProps>(), {
  isSaving: false,
  visible: false,
});

const emit = defineEmits<{
  (e: 'save', imageUrl: string, coordinates: Coordinates): void;
  (e: 'cancel'): void;
}>();

const imageUrl = ref<string | null>(null);
const coordinates = ref<Coordinates | null>(null);

function onSave() {
  if (imageUrl.value && coordinates.value) {
    emit('save', imageUrl.value, coordinates.value);
  }
}

function onChangeImage() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = null;
  coordinates.value = null;
}

function onFileSelect(files: FileList) {
  if (!files.length) return;

  const file = files[0];
  imageUrl.value = URL.createObjectURL(file);
}

function onImageCropperChange(coords: Coordinates) {
  coordinates.value = coords;
}
</script>
