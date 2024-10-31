<template>
  <DialogBase
    size="lg"
    title="Select Avatar"
    :visible="visible"
    @close="$emit('cancel')"
  >
    <template #default>
      <div
        v-if="isSaving"
        class="w-full h-[400px] text-xl italic flex justify-center items-center space-x-3"
        data-testid="msg-processing-image"
      >
        <LoadingSpinner message="Processing image..." />
      </div>

      <!-- Show image cropper if we have a URL -->
      <div v-else-if="imageUrl" class="flex justify-center">
        <ImageCropper
          class="w-[600px] aspect-video"
          default-boundaries="fill"
          :image="imageUrl"
          :target-width="512"
          circle
          @change="onImageCropperChange"
        />
      </div>

      <!-- Otherwise, show a drag-and-drop target -->
      <FileUpload
        v-else
        accept="image/*"
        test-id="upload-avatar"
        @change="onFileSelect"
      />
    </template>

    <template #buttons>
      <FormButton
        v-if="file && coordinates"
        test-id="btn-save-avatar"
        type="primary"
        :is-loading="isSaving"
        @click="onSave"
      >
        Save
      </FormButton>

      <FormButton
        v-if="file && coordinates"
        test-id="btn-change-image"
        :disabled="isSaving"
        @click="reset"
      >
        Change Image
      </FormButton>

      <FormButton
        :disabled="isSaving"
        test-id="btn-cancel-avatar"
        @click="$emit('cancel')"
      >
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
import LoadingSpinner from '../common/loading-spinner.vue';
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
  (e: 'save', file: File, coordinates: Coordinates): void;
  (e: 'cancel'): void;
}>();

const file = ref<File | null>(null);
const imageUrl = ref<string | null>(null);
const coordinates = ref<Coordinates | null>(null);

function reset() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = null;
  file.value = null;
  coordinates.value = null;
}

function onSave() {
  if (file.value && coordinates.value) {
    emit('save', file.value, coordinates.value);
  }
}

function onFileSelect(files: FileList) {
  if (!files.length) return;

  file.value = files[0];
  imageUrl.value = URL.createObjectURL(file.value);
}

function onImageCropperChange(coords: Coordinates) {
  coordinates.value = coords;
}

defineExpose({ reset });
</script>
