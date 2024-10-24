<template>
  <ConfirmDialog
    title="Confirm Membership Change?"
    size="lg"
    icon="fa-regular fa-circle-question text-5xl"
    :visible="visible"
    :is-loading="isChanging"
    confirm-text="Yes, change my membership"
    @confirm="$emit('confirm')"
    @cancel="$emit('cancel')"
  >
    <p class="text-justify">
      You are about to change your current membership tier. Please review the
      change below and confirm your action.
    </p>

    <div class="flex justify-evenly items-center">
      <p class="font-bold flex flex-col gap-1 text-center">
        <span class="font-bold">{{ oldMembership.name }}</span>
        <span class="text-xs font-mono">({{ oldPrice }})</span>
      </p>

      <span>
        <i class="fa-solid fa-arrow-right"></i>
      </span>

      <p class="font-bold flex flex-col gap-1 text-center">
        <span class="font-bold">{{ newMembership.name }}</span>
        <span class="text-xs font-mono">({{ newPrice }})</span>
      </p>
    </div>

    <p class="text-justify">
      Are you sure you want to continue with this change?
    </p>

    <p class="text-sm text-justify text-warn">
      <span class="font-bold">Note: </span>
      <span class="italic">
        Your current membership will be prorated and you will be refunded for
        the time remaining on it. You will be charged for the new membership at
        the same time. These charges will appear together as single
        charge/refund on your credit card statement. An invoice will be emailed
        to you detailing the change.
      </span>
    </p>
  </ConfirmDialog>
</template>

<script setup lang="ts">
import { MembershipDTO } from '@bottomtime/api';

import { computed } from 'vue';

import ConfirmDialog from '../../dialog/confirm-dialog.vue';

interface ConfirmChangeDialogProps {
  isChanging?: boolean;
  newMembership: MembershipDTO;
  oldMembership: MembershipDTO;
  visible?: boolean;
}

const props = withDefaults(defineProps<ConfirmChangeDialogProps>(), {
  visible: false,
  isChanging: false,
});

defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function formatPrice(membership: MembershipDTO) {
  const price = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: membership.currency,
  }).format(membership.price);

  return `${price} / ${membership.frequency}`;
}

const oldPrice = computed(() => formatPrice(props.oldMembership));
const newPrice = computed(() => formatPrice(props.newMembership));
</script>
