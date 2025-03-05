<template>
  <DialogBase
    title="Request Signatures"
    :visible="visible"
    @close="$emit('close')"
  >
    <template #default>
      <RequestSignature :entry="logEntry" />
    </template>
    <template #buttons>
      <FormButton type="primary" @click="$emit('close')"> Close </FormButton>
    </template>
  </DialogBase>
</template>

<script setup lang="ts">
import { LogEntryDTO } from '@bottomtime/api';

import FormButton from '../common/form-button.vue';
import RequestSignature from '../logbook/editor/request-signature.vue';
import DialogBase from './dialog-base.vue';

interface RequestSignaturesDialogProps {
  logEntry: LogEntryDTO;
  visible?: boolean;
}

withDefaults(defineProps<RequestSignaturesDialogProps>(), {
  visible: false,
});
defineEmits<{
  (e: 'close'): void;
}>();
</script>
