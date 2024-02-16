<template>
  <DialogBase
    size="lg"
    title="Select Avatar"
    :visible="visible"
    @close="$emit('cancel')"
  >
    <template #default>
      <div
        class="flex flex-row gap-3 m-4 mb-3 p-2 rounded-md text-sm bg-link text-grey-900"
      >
        <span>
          <i class="fas fa-info-circle fa-2x"></i>
        </span>
        <div class="grow">
          <span class="font-bold">
            TODO: I need to build out this dialog still but I need some
            additional infrastructure first.
          </span>
          <ul class="list-inside list-disc">
            <li>I need file storage for uploaded images.</li>
            <li>I need a way to crop and center uploaded images.</li>
            <li>I might accept URLs from trusted sources (e.g. Gravatar.)</li>
          </ul>
        </div>
      </div>
    </template>

    <template #buttons>
      <FormButton type="primary" disabled @click="onSave"> Save </FormButton>
      <FormButton @click="$emit('cancel')"> Cancel </FormButton>
    </template>
  </DialogBase>
</template>

<script setup lang="ts">
import FormButton from '../common/form-button.vue';
import DialogBase from './dialog-base.vue';

type ChangeAvatarDialogProps = {
  avatarUrl: string;
  displayName: string;
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
