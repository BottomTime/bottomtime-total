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
      :options="state.membershipOptions ?? []"
      @cancel="onCancelChangeAccountType"
      @change-membership="onConfirmChangeAccountType"
    />
  </DrawerPanel>

  <ConfirmCancelDialog
    :visible="state.showCancelMembership"
    :is-canceling="state.isCanceling"
    @confirm="onConfirmCancelMembership"
    @cancel="onAbortCancelMembership"
  />

  <LoadingSpinner v-if="state.isLoading" message="Please wait..." />

  <div v-else-if="state.membershipOptions">
    <FormField label="Account type">
      <fieldset
        class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline"
        :disabled="state.isSaving"
      >
        <div class="grow w-full flex items-baseline gap-3">
          <p class="text-lg" data-testid="account-tier-value">
            {{ accountTier }}
          </p>
          <p class="text-xs font-mono" data-testid="account-tier-price">
            {{ tierPrice }}
          </p>
        </div>

        <div class="min-w-36 lg:min-w-40 xl:min-w-48">
          <FormButton
            control-id="change-account-type"
            test-id="change-account-type"
            stretch
            @click="onChangeAccountType"
          >
            {{
              props.membership.accountTier === AccountTier.Basic
                ? 'Upgrade account...'
                : 'Change account type...'
            }}
          </FormButton>
        </div>
      </fieldset>
    </FormField>

    <FormField
      v-if="props.membership.nextBillingDate"
      label="Next billing date"
    >
      <p>
        {{ dayjs(membership.nextBillingDate).format('LL') }}
      </p>
    </FormField>
  </div>

  <div v-else class="px-3 flex gap-3 items-center">
    <p>
      <i class="fas fa-exclamation-triangle text-danger text-2xl"></i>
    </p>
    <p>
      There seems to have been an error while retrieving membership information
      from the server. Please try back later.
    </p>
  </div>
</template>

<script lang="ts" setup>
import {
  AccountTier,
  ListMembershipsResponseDTO,
  MembershipStatus,
  MembershipStatusDTO,
  UserDTO,
} from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed, onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { ToastType } from '../../../common';
import { useLocation } from '../../../location';
import { useOops } from '../../../oops';
import { useCurrentUser, useToasts } from '../../../store';
import DrawerPanel from '../../common/drawer-panel.vue';
import FormButton from '../../common/form-button.vue';
import FormField from '../../common/form-field.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';
import ConfirmCancelDialog from './confirm-cancel-dialog.vue';
import MembershipForm from './membership-form.vue';
import MembershipPayment from './membership-payment.vue';

interface ManageMembershipProps {
  user: UserDTO;
  membership: MembershipStatusDTO;
}

interface ManageMembershipState {
  accountTier: AccountTier;
  membershipOptions?: ListMembershipsResponseDTO;
  isCanceling: boolean;
  isLoading: boolean;
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
  accountTier: props.membership.accountTier,
  isCanceling: false,
  isLoading: true,
  isSaving: false,
  requirePayment: false,
  showCancelMembership: false,
  showChangeAccountType: false,
});
const emit = defineEmits<{
  (e: 'membership-changed', membershipStatus: MembershipStatusDTO): void;
}>();

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

const accountTier = computed<string>(() => {
  const tier = state.membershipOptions?.find(
    (m) => m.accountTier === props.membership.accountTier,
  );
  return tier?.name ?? 'Error retrieving membership data';
});
const tierPrice = computed<string>(() => {
  const tier = state.membershipOptions?.find(
    (m) => m.accountTier === props.membership.accountTier,
  );

  if (tier) {
    return tier.price === 0
      ? ''
      : `(${formatCurrency(tier.price, tier.currency)} / ${tier.frequency})`;
  }

  return '';
});

function onChangeAccountType() {
  state.accountTier = props.membership.accountTier;
  state.showChangeAccountType = true;
}

function onCancelChangeAccountType() {
  state.showChangeAccountType = false;
  state.accountTier = props.membership.accountTier;
}

async function onConfirmChangeAccountType(
  newAccountTier: AccountTier,
): Promise<void> {
  await oops(async () => {
    if (
      !currentUser.user ||
      currentUser.membership.accountTier === newAccountTier
    ) {
      return;
    }

    /*
    TODO: Determine workflow from state change:
      - Paid to paid tier: Update subscription and display new price?
    */

    let membership = props.membership;

    // User is canceling membership and returning to free tier.
    // Ask for their confirmation before proceeding.
    if (newAccountTier === AccountTier.Basic) {
      state.showCancelMembership = true;
      return;
    }

    membership = await client.memberships.updateMembership(
      currentUser.user.username,
      newAccountTier,
    );
    emit('membership-changed', membership);

    // User now has an active subscription. We can navigate to a confirmation page.
    if (
      membership.status === MembershipStatus.Active ||
      membership.status === MembershipStatus.Trialing
    ) {
      return;
    }

    // Otherwise, We need to get/update payment info for the user.
    state.requirePayment = true;
  });

  state.isSaving = false;
}

async function onConfirmCancelMembership(): Promise<void> {
  state.isCanceling = true;

  await oops(async () => {
    if (!currentUser.user) return;

    await client.memberships.cancelMembership(currentUser.user.username);

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
  state.accountTier = props.membership.accountTier;
}

onMounted(async () => {
  await oops(
    async () => {
      state.membershipOptions = await client.memberships.listMemberships();
    },
    {
      default: () => {
        // No-op: error message will be displayed automatically.
      },
    },
  );

  state.isLoading = false;
});
</script>
