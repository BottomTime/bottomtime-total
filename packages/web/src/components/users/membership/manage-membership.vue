<template>
  <DrawerPanel
    title="Change Account Type"
    :visible="state.showChangeAccountType"
    @close="onCancelUpdateAccountType"
  >
    <MembershipForm
      :account-tier="state.accountTier"
      :is-saving="state.isSaving"
      :options="state.membershipOptions ?? []"
      @cancel="onCancelUpdateAccountType"
      @change-membership="onGetFinalConfirmation"
    />
  </DrawerPanel>

  <ConfirmCancelDialog
    :visible="state.showCancelMembership"
    :is-canceling="state.isCanceling"
    @confirm="onConfirmCancelMembership"
    @cancel="onAbortCancelMembership"
  />

  <ConfirmChangeDialog
    :visible="state.showConfirmChangeDialog"
    :is-changing="state.isSaving"
    :old-membership="state.currentMembershipOption ?? ErrorMembership"
    :new-membership="state.desiredMembershipOption ?? ErrorMembership"
    @confirm="onConfirmChangeMembership"
    @cancel="onAbortChangeMembership"
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
            @click="onUpdateAccountType"
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
  BillingFrequency,
  ListMembershipsResponseDTO,
  MembershipDTO,
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
import ConfirmChangeDialog from './confirm-change-dialog.vue';
import MembershipForm from './membership-form.vue';

interface ManageMembershipProps {
  user: UserDTO;
  membership: MembershipStatusDTO;
}

interface ManageMembershipState {
  accountTier: AccountTier;
  currentMembershipOption?: MembershipDTO;
  desiredMembershipOption?: MembershipDTO;
  membershipOptions?: ListMembershipsResponseDTO;
  isCanceling: boolean;
  isLoading: boolean;
  isSaving: boolean;
  showCancelMembership: boolean;
  showChangeAccountType: boolean;
  showConfirmChangeDialog: boolean;
}

const ErrorMembership: MembershipDTO = {
  accountTier: AccountTier.Basic,
  currency: 'cad',
  frequency: BillingFrequency.Year,
  price: 0,
  name: 'Error retrieving membership data',
} as const;

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
  showCancelMembership: false,
  showChangeAccountType: false,
  showConfirmChangeDialog: false,
});

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

function onUpdateAccountType() {
  state.accountTier = props.membership.accountTier;
  state.showChangeAccountType = true;
}

function onCancelUpdateAccountType() {
  state.showChangeAccountType = false;
  state.accountTier = props.membership.accountTier;
}

async function onGetFinalConfirmation(
  newAccountTier: AccountTier,
): Promise<void> {
  if (currentUser.membership.accountTier === newAccountTier) {
    // No change. Return without doing anything.
    return;
  }

  state.desiredMembershipOption = state.membershipOptions?.find(
    (m) => m.accountTier === newAccountTier,
  );
  if (!state.desiredMembershipOption) return;

  if (currentUser.membership.accountTier === AccountTier.Basic) {
    // User is creating a new membership from a free account. No need to confirm a change.
    // Instead, proceed to checkout/payment page.
    await onConfirmChangeMembership();
  } else if (newAccountTier === AccountTier.Basic) {
    // User is canceling membership and returning to free tier.
    // Ask for their confirmation before proceeding.
    state.showCancelMembership = true;
  } else {
    // Otherwise, the user is upgrading/downgrading their membership.
    // Ask them to confirm.
    state.showConfirmChangeDialog = true;
  }
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

async function onConfirmChangeMembership(): Promise<void> {
  const newAccountTier = state.desiredMembershipOption?.accountTier;
  if (!newAccountTier) return;

  await oops(async () => {
    if (!currentUser.user) return;

    state.isSaving = true;
    currentUser.membership = await client.memberships.updateMembership(
      currentUser.user.username,
      newAccountTier,
    );

    location.assign('/membership/confirmation');
  });

  state.isSaving = false;
}

function onAbortChangeMembership() {
  state.showConfirmChangeDialog = false;
}

onMounted(async () => {
  await oops(
    async () => {
      state.membershipOptions = await client.memberships.listMemberships();
      state.currentMembershipOption = state.membershipOptions?.find(
        (m) => m.accountTier === props.membership.accountTier,
      );
    },
    {
      default: (err: unknown) => {
        // eslint-disable-next-line no-console
        console.error(err);
      },
    },
  );

  state.isLoading = false;
});
</script>
