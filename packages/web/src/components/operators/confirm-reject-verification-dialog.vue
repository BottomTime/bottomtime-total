<template>
  <DialogBase
    size="md"
    title="Reject Verification?"
    :disabled="isSaving"
    :visible="visible"
    @close="onCancel"
  >
    <template #default>
      <div class="flex gap-3">
        <p class="text-4xl">
          <i class="fa-regular fa-circle-question"></i>
        </p>

        <div class="space-y-3">
          <p>
            Do you want to reject the verification request for this dive shop?
            If so, it is advised that you provide a detailed reason for the
            rejection as well as steps for the operator to remedy the situation.
          </p>

          <FormField label="Reason" control-id="reject-reason">
            <FormTextArea
              v-model.trim="reason"
              control-id="reject-reason"
              test-id="reject-reason"
              autofocus
              :maxlength="1000"
            />
          </FormField>
        </div>
      </div>
    </template>
    <template #buttons>
      <FormButton
        test-id="btn-confirm-reject"
        type="danger"
        :is-loading="isSaving"
        submit
        @click="onConfirm"
      >
        Reject
      </FormButton>
      <FormButton test-id="btn-cancel-reject" @click="onCancel">
        Cancel
      </FormButton>
    </template>
  </DialogBase>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextArea from '../common/form-text-area.vue';
import DialogBase from '../dialog/dialog-base.vue';

interface ConfirmRejectVerificationDialogProps {
  isSaving?: boolean;
  visible?: boolean;
}

withDefaults(defineProps<ConfirmRejectVerificationDialogProps>(), {
  isSaving: false,
  visible: false,
});
const emit = defineEmits<{
  (e: 'confirm', message?: string): void;
  (e: 'cancel'): void;
}>();

const reason = ref('');

function onConfirm() {
  emit('confirm', reason.value || undefined);
}

function onCancel() {
  reason.value = '';
  emit('cancel');
}

onMounted(() => {
  reason.value = '';
});
</script>
