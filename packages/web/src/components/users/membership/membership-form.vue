<template>
  <form @submit.prevent="">
    <fieldset class="px-4 space-y-6" :disabled="isSaving">
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
            Get all of the features of a free account plus some added benefits:
          </p>

          <ul class="list-outside list-disc ml-6">
            <li>Add videos to your dive logs</li>
            <li>
              Get advanced metrics with our enhanced dashboard for pro users
            </li>
            <li>
              Get a <span class="font-bold">Pro Diver</span> badge next to your
              username
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
              Reach new divers by having your shop appear in search results for
              dive sites
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
          :is-loading="isSaving"
          :disabled="state.accountTier === props.accountTier.toString()"
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
</template>

<script lang="ts" setup>
import { AccountTier } from '@bottomtime/api';

import { reactive } from 'vue';

import FormButton from '../../common/form-button.vue';
import FormRadio from '../../common/form-radio.vue';

interface MembershipFormProps {
  accountTier: AccountTier;
  isSaving?: boolean;
}

interface MembershipFormState {
  accountTier: string;
}

const props = withDefaults(defineProps<MembershipFormProps>(), {
  isSaving: false,
});
const state = reactive<MembershipFormState>({
  accountTier: props.accountTier.toString(),
});

const emit = defineEmits<{
  (e: 'change-membership', accountTier: AccountTier): void;
  (e: 'cancel'): void;
}>();

function onConfirmChangeAccountType() {
  emit('change-membership', parseInt(state.accountTier, 10));
}

function onCancelChangeAccountType() {
  emit('cancel');
}
</script>
