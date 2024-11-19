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
      <div v-else-if="state.imageUrl" class="flex justify-center">
        <ImageCropper
          class="w-[600px] aspect-video"
          default-boundaries="fill"
          :image="state.imageUrl"
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
        v-if="state.file && state.coordinates"
        test-id="btn-save-image"
        type="primary"
        :is-loading="isSaving"
        @click="onSave"
      >
        Save
      </FormButton>

      <FormButton
        v-if="state.file && state.coordinates"
        test-id="btn-change-image"
        :disabled="isSaving"
        @click="reset"
      >
        Change Image
      </FormButton>

      <FormButton
        :disabled="isSaving"
        test-id="btn-cancel-image"
        @click="$emit('cancel')"
      >
        Cancel
      </FormButton>
    </template>
  </DialogBase>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

import { Coordinates } from '../../common';
import FileUpload from '../common/file-upload.vue';
import FormButton from '../common/form-button.vue';
import ImageCropper from '../common/image-cropper.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import DialogBase from './dialog-base.vue';

type UploadImageDialogProps = {
  avatarUrl?: string;
  isSaving?: boolean;
  visible?: boolean;
};

type UploadImageDialogState = {
  file?: File;
  imageUrl?: string;
  coordinates?: Coordinates;
};

withDefaults(defineProps<UploadImageDialogProps>(), {
  isSaving: false,
  visible: false,
});

const emit = defineEmits<{
  (e: 'save', file: File, coordinates: Coordinates): void;
  (e: 'cancel'): void;
}>();

const state = reactive<UploadImageDialogState>({});

function reset() {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageUrl = undefined;
  state.file = undefined;
  state.coordinates = undefined;
}

function onSave() {
  if (state.file && state.coordinates) {
    emit('save', state.file, state.coordinates);
  }
}

function onFileSelect(files: FileList) {
  if (!files.length) return;

  state.file = files[0];
  state.imageUrl = URL.createObjectURL(state.file);
}

function onImageCropperChange(coords: Coordinates) {
  state.coordinates = coords;
}

defineExpose({ reset });
</script>
