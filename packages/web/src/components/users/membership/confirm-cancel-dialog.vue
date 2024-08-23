<template>
  <ConfirmDialog
    title="Cancel Membership?"
    confirm-text="Yes, cancel my membership"
    size="lg"
    dangerous
    :is-loading="isCanceling"
    :visible="visible"
    @confirm="$emit('confirm')"
    @cancel="$emit('cancel')"
  >
    <div class="flex gap-4">
      <div class="my-4">
        <i class="fas fa-exclamation-triangle text-danger text-4xl"></i>
      </div>

      <div class="space-y-3">
        <p>
          You are about to cancel your current membership. This will immediately
          revert your account back to a free account. You will no longer have
          access to the benefits of your current membership. Please make note of
          the following:
        </p>

        <ul class="list-disc list-outside px-6 text-sm">
          <li>
            You will receive a prorated refund for the remaining time on your
            current membership.
          </li>
          <li>
            Any data you have provided or uploaded using the features of your
            current membership will <span class="font-bold">not</span> be
            deleted and you will still have access to it. However, you may not
            be able to edit, delete, or modify that data without the features of
            your current membership.
          </li>
          <li>
            You will keep all of the XP and badges you have earned while on your
            current membership.
          </li>
          <li>
            You can re-enable your membership at any time by visiting your
            account page and selecting a new membership tier.
          </li>
        </ul>

        <p class="font-bold text-lg">Are you sure you want to proceed?</p>
      </div>
    </div>
  </ConfirmDialog>
</template>

<script setup lang="ts">
import ConfirmDialog from '../../dialog/confirm-dialog.vue';

interface ConfirmCancelDialogProps {
  visible?: boolean;
  isCanceling?: boolean;
}

withDefaults(defineProps<ConfirmCancelDialogProps>(), {
  visible: false,
  isCanceling: false,
});

defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>
