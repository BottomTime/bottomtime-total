<template>
  <DialogBase
    :visible="visible"
    size="lg"
    title="Select Location"
    @close="$emit('cancel')"
  >
    <template #default>
      <GoogleMap />
    </template>

    <template #buttons>
      <FormButton type="primary">Select</FormButton>
      <FormButton @click="$emit('cancel')">Cancel</FormButton>
    </template>
  </DialogBase>
</template>

<script setup lang="ts">
import FormButton from '../common/form-button.vue';
import GoogleMap from '../common/google-map.vue';
import DialogBase from './dialog-base.vue';

type LocationDialogProps = {
  visible?: boolean;
};

withDefaults(defineProps<LocationDialogProps>(), {
  visible: false,
});
defineEmits<{
  (e: 'cancel'): void;
}>();
</script>
