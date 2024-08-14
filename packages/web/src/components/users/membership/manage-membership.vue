<template>
  <DrawerPanel
    title="Change Account Type"
    :visible="state.showChangeAccountType"
    @close="onCancelChangeAccountType"
  >
    <MembershipForm
      v-if="state.mode === ManageMembershipMode.Manage"
      :user="props.user"
      :is-saving="state.isSaving"
      @cancel="onCancelChangeAccountType"
      @change-membership="onConfirmChangeAccountType"
    />

    <MembershipCheckout v-else :user="user" :account-tier="state.accountTier" />
  </DrawerPanel>

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
import { AccountTier, UserDTO } from '@bottomtime/api';

import { computed, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { ToastType } from '../../../common';
import { useOops } from '../../../oops';
import { useToasts } from '../../../store';
import DrawerPanel from '../../common/drawer-panel.vue';
import FormButton from '../../common/form-button.vue';
import FormField from '../../common/form-field.vue';
import MembershipCheckout from './membership-checkout.vue';
import MembershipForm from './membership-form.vue';

enum ManageMembershipMode {
  Manage,
  Checkout,
}

interface ManageMembershipProps {
  user: UserDTO;
}

interface ManageMembershipState {
  accountTier: AccountTier;
  isCreatingSession: boolean;
  isSaving: boolean;
  showChangeAccountType: boolean;
  mode: ManageMembershipMode;
}

const client = useClient();
const oops = useOops();
const toasts = useToasts();

const props = defineProps<ManageMembershipProps>();
const state = reactive<ManageMembershipState>({
  accountTier: props.user.accountTier,
  isCreatingSession: false,
  isSaving: false,
  showChangeAccountType: false,
  mode: ManageMembershipMode.Manage,
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
}

async function onConfirmChangeAccountType(
  newAccountTier: AccountTier,
): Promise<void> {
  state.isSaving = true;

  if (newAccountTier > props.user.accountTier) {
    // User is upgrading their account... need to go through the checkout process
    state.accountTier = newAccountTier;
    state.mode = ManageMembershipMode.Checkout;
    return;
  }

  await oops(async () => {
    const user = client.users.wrapDTO(props.user);

    await user.changeMembership(newAccountTier);

    toasts.toast({
      id: 'account-type-changed',
      message: 'Account type changed successfully!',
      type: ToastType.Success,
    });
    emit('account-type-changed', newAccountTier);
    state.showChangeAccountType = false;
  });

  state.isSaving = false;
}
</script>
