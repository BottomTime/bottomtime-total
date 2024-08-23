<template>
  <form @submit.prevent="">
    <fieldset class="px-4 space-y-6" :disabled="isSaving">
      <div class="space-y-6">
        <div v-for="membership of options" :key="membership.accountTier">
          <FormRadio
            v-model="accountTier"
            :control-id="`account-tier-${membership.accountTier}`"
            :test-id="`account-tier-${membership.accountTier}`"
            group="account-tier"
            :value="membership.accountTier.toString()"
          >
            <p class="flex items-baseline gap-3">
              <span class="font-bold text-lg">{{ membership.name }}</span>

              <span class="font-mono text-xs"
                >( {{ formatCurrency(membership.price, membership.currency) }} /
                {{ membership.frequency }} )</span
              >

              <span
                v-if="props.accountTier === membership.accountTier"
                class="rounded-full bg-success px-2 text-sm"
              >
                Current Membership
              </span>
            </p>
          </FormRadio>

          <div class="space-y-3 pl-8 text-justify">
            <p v-if="membership.description">
              {{ membership.description }}
            </p>

            <ul
              v-if="membership.marketingFeatures"
              class="list-outside list-disc ml-6"
            >
              <li
                v-for="feature of membership.marketingFeatures"
                :key="feature"
              >
                {{ feature }}
              </li>
            </ul>
          </div>
        </div>

        <div class="flex justify-center gap-3">
          <FormButton
            type="primary"
            :is-loading="isSaving"
            :disabled="accountTier === props.accountTier.toString()"
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
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { AccountTier, ListMembershipsResponseDTO } from '@bottomtime/api';

import { ref } from 'vue';

import FormButton from '../../common/form-button.vue';
import FormRadio from '../../common/form-radio.vue';

interface MembershipFormProps {
  accountTier: AccountTier;
  isSaving?: boolean;
  options: ListMembershipsResponseDTO;
}

const props = withDefaults(defineProps<MembershipFormProps>(), {
  isSaving: false,
});
const accountTier = ref<string>(props.accountTier.toString());

const emit = defineEmits<{
  (e: 'change-membership', accountTier: AccountTier): void;
  (e: 'cancel'): void;
}>();

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function onConfirmChangeAccountType() {
  emit('change-membership', parseInt(accountTier.value, 10));
}

function onCancelChangeAccountType() {
  emit('cancel');
}
</script>
