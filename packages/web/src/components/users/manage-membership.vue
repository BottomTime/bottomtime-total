<template>
  <DrawerPanel
    title="Change Account Type"
    :visible="state.showChangeAccountType"
    @close="onCancelChangeAccountType"
  >
    <form @submit.prevent="">
      <fieldset class="px-4 space-y-6" :disabled="state.isSaving">
        <div>
          <FormRadio
            v-model="state.accountTier"
            control-id="account-tier-basic"
            test-id="account-tier-basic"
            group="account-tier"
            :value="AccountTier.Basic.toString()"
          >
            <p class="flex items-baseline gap-3">
              <span class="font-bold text-lg">Free account</span>
              <span class="font-mono text-xs">( $0 forever! )</span>
            </p>
          </FormRadio>

          <div class="space-y-3 pl-8 text-justify">
            <p>
              Get all of the features of BottomTime for personal use - for free!
            </p>

            <ul class="list-outside list-disc ml-6">
              <li>Upload and log your dives</li>
              <li>
                Track your dive metrics and history in your personal dashboard
              </li>
              <li>Find dive sites and dive shops</li>
              <li>Follow your dive buddies and</li>
              <li>Earn XP and level up</li>
            </ul>
          </div>
        </div>

        <div>
          <FormRadio
            v-model="state.accountTier"
            control-id="account-tier-pro"
            test-id="account-tier-pro"
            group="account-tier"
            :value="AccountTier.Pro.toString()"
          >
            <p class="flex items-baseline gap-3">
              <span class="font-bold text-lg">Pro account</span>
              <span class="font-mono text-xs">( $40 / year )</span>
            </p>
          </FormRadio>

          <div class="space-y-3 pl-8 text-justify">
            <p>
              Get all of the features of a free account plus some added
              benefits:
            </p>

            <ul class="list-outside list-disc ml-6">
              <li>Add videos to your dive logs</li>
              <li>
                Get advanced metrics with our enhanced dashboard for pro users
              </li>
              <li>
                Get a <span class="font-bold">Pro Diver</span> badge next to
                your username
              </li>
              <li>Earn XP faster than with a free account</li>
            </ul>
          </div>
        </div>

        <div>
          <FormRadio
            v-model="state.accountTier"
            control-id="account-tier-shop-owner"
            test-id="account-tier-shop-owner"
            group="account-tier"
            :value="AccountTier.ShopOwner.toString()"
          >
            <p class="flex items-baseline gap-3">
              <span class="font-bold text-lg">Dive shop owner</span>
              <span class="font-mono text-xs">( $100 / year )</span>
            </p>
          </FormRadio>

          <div class="space-y-3 pl-8 text-justify">
            <p>
              Get all of the benefits of a pro account, plus the ability to
              register and manage your dive shop on our site.
            </p>

            <ul class="list-outside list-disc ml-6">
              <li>
                Register and manage your shop's profile including links to your
                socials and website
              </li>
              <li>Upload images and videos</li>
              <li>
                Reach new divers by having your shop appear in search results
                for dive sites
              </li>
              <li>
                Tag dive sites that your shop visits so that divers will be
                alerted when the sites appear in their search
              </li>
              <li>And more!</li>
            </ul>
          </div>
        </div>

        <div class="flex justify-center gap-3">
          <FormButton
            type="primary"
            :is-loading="state.isSaving"
            :disabled="state.accountTier === props.user.accountTier.toString()"
            control-id="confirm-account-change"
            test-id="confirm-account-change"
            submit
            @click="onConfirmChangeAccountType"
          >
            Change account type
          </FormButton>

          <FormButton
            control-id="cancel-account-change"
            test-id="cancel-account-change"
            @click="onCancelChangeAccountType"
          >
            Cancel
          </FormButton>
        </div>
      </fieldset>
    </form>
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

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import DrawerPanel from '../common/drawer-panel.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormRadio from '../common/form-radio.vue';

interface ManageAccountProps {
  user: UserDTO;
}

interface ManageAccountState {
  accountTier: string;
  isSaving: boolean;
  showChangeAccountType: boolean;
}

const client = useClient();
const oops = useOops();
const toasts = useToasts();

const props = defineProps<ManageAccountProps>();
const state = reactive<ManageAccountState>({
  accountTier: props.user.accountTier.toString(),
  isSaving: false,
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
  state.accountTier = props.user.accountTier.toString();
  state.showChangeAccountType = true;
}

function onCancelChangeAccountType() {
  state.showChangeAccountType = false;
}

async function onConfirmChangeAccountType(): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    const newAccountTier = parseInt(state.accountTier, 10) as AccountTier;
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
