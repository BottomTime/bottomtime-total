<template>
  <DrawerPanel
    title="Change Account Type"
    :visible="state.showChangeAccountType"
    @close="onCancelChangeAccountType"
  >
    <MembershipPayment v-if="state.requirePayment" />

    <MembershipForm
      v-else
      :account-tier="state.accountTier"
      :is-saving="state.isSaving"
      @cancel="onCancelChangeAccountType"
      @change-membership="onConfirmChangeAccountType"
    />
  </DrawerPanel>

  <ConfirmDialog
    title="Cancel Membership?"
    confirm-text="Yes, cancel my membership"
    size="lg"
    dangerous
    :is-loading="state.isCanceling"
    :visible="state.showCancelMembership"
    @confirm="onConfirmCancelMembership"
    @cancel="onAbortCancelMembership"
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

  <FormField label="Account type">
    <fieldset
      class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline"
      :disabled="state.isSaving"
    >
      <div class="grow w-full">
        <span data-testid="account-tier-value">
          {{ accountTier }}
        </span>
      </div>

      <div class="min-w-36 lg:min-w-40 xl:min-w-48">
        <FormButton
          control-id="change-account-type"
          test-id="change-account-type"
          stretch
          @click="onChangeAccountType"
        >
          Change account type...
        </FormButton>
      </div>
    </fieldset>
  </FormField>
</template>

<script lang="ts" setup>
import { AccountTier, MembershipStatus, UserDTO } from '@bottomtime/api';

import { computed, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { ToastType } from '../../../common';
import { useLocation } from '../../../location';
import { useOops } from '../../../oops';
import { useCurrentUser, useToasts } from '../../../store';
import DrawerPanel from '../../common/drawer-panel.vue';
import FormButton from '../../common/form-button.vue';
import FormField from '../../common/form-field.vue';
import ConfirmDialog from '../../dialog/confirm-dialog.vue';
import MembershipForm from './membership-form.vue';
import MembershipPayment from './membership-payment.vue';

interface ManageMembershipProps {
  user: UserDTO;
}

interface ManageMembershipState {
  accountTier: AccountTier;
  isCanceling: boolean;
  isSaving: boolean;
  requirePayment: boolean;
  showCancelMembership: boolean;
  showChangeAccountType: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
const location = useLocation();
const oops = useOops();
const toasts = useToasts();

const props = defineProps<ManageMembershipProps>();
const state = reactive<ManageMembershipState>({
  accountTier: props.user.accountTier,
  isCanceling: false,
  isSaving: false,
  requirePayment: false,
  showCancelMembership: false,
  showChangeAccountType: false,
});
const emit = defineEmits<{
  (e: 'account-type-changed', accountTier: AccountTier): void;
}>();

const accountTier = computed<string>(() => {
  switch (props.user.accountTier) {
    default:
    case AccountTier.Basic:
      return 'Free account';
    case AccountTier.Pro:
      return 'Pro account';
    case AccountTier.ShopOwner:
      return 'Dive shop owner';
  }
});

function onChangeAccountType() {
  state.accountTier = props.user.accountTier;
  state.showChangeAccountType = true;
}

function onCancelChangeAccountType() {
  state.showChangeAccountType = false;
  state.accountTier = props.user.accountTier;
}

async function onConfirmChangeAccountType(
  newAccountTier: AccountTier,
): Promise<void> {
  await oops(async () => {
    if (!currentUser.user || currentUser.user.accountTier === newAccountTier)
      return;

    /*
    TODO: Determine workflow from state change:
      - Free to paid tier: Need to get payment info? Checkout.
      - Paid to free tier: Cancel subscription.
      - Paid to paid tier: Update subscription and display new price.
    */

    if (newAccountTier === AccountTier.Basic) {
      // User is canceling membership and returning to free tier.
      // Ask for their confirmation before proceeding.
      state.showCancelMembership = true;
      return;
    }

    let status = await client.payments.getMembershipStatus(
      currentUser.user.username,
    );

    switch (status.status) {
      case MembershipStatus.None:
        state.isSaving = true;
        // User has no subscription or is not yet registered as a customer in Stripe.
        status = await client.payments.createMemberhsip(
          currentUser.user.username,
          newAccountTier,
        );

      /* eslint-disable-next-line no-fallthrough */
      case MembershipStatus.Incomplete:
        state.requirePayment = true;
        break;
    }
  });

  state.isSaving = false;
}

async function onConfirmCancelMembership(): Promise<void> {
  state.isCanceling = true;

  await oops(async () => {
    if (!currentUser.user) return;

    await client.payments.cancelMembership(currentUser.user.username);

    toasts.toast({
      id: 'membership-canceled',
      message: 'Your membership has been canceled.',
      type: ToastType.Success,
    });
    state.showCancelMembership = false;
    location.assign('/membership/canceled');
  });

  state.isCanceling = false;
}

function onAbortCancelMembership() {
  state.showCancelMembership = false;
  state.accountTier = props.user.accountTier;
}
</script>
