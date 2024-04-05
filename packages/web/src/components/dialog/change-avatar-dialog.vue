<template>
  <DialogBase
    size="lg"
    title="Select Avatar"
    :visible="visible"
    @close="$emit('cancel')"
  >
    <template #default>
      <ImageCropper
        v-if="avatarUrl"
        :image="avatarUrl"
        :target-width="512"
        circle
      />
      <div v-else class="w-full flex flex-col space-y-3">
        <div class="h-[200px] border-2 border-secondary rounded-lg flex">
          <div class="m-auto text-center text-xl text-secondary space-x-3">
            <span>
              <i class="fa-regular fa-file-image"></i>
            </span>
            <span>Drag your image here.</span>
          </div>
        </div>

        <div class="text-center">
          <FormButton size="sm">Select File...</FormButton>
        </div>
      </div>
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
