<template>
  <form @submit.prevent="">
    <fieldset class="px-4 space-y-6" :disabled="isSaving">
      <div v-if="state.isLoading" class="text-center my-8">
        <LoadingSpinner message="Loading membership tiers..." />
      </div>

      <div v-else-if="state.memberships" class="space-y-6">
        <div
          v-for="membership of state.memberships"
          :key="membership.accountTier"
        >
          <FormRadio
            v-model="state.accountTier"
            :control-id="`account-tier-${membership.accountTier}`"
            :test-id="`account-tier-${membership.accountTier}`"
            group="account-tier"
            :value="membership.accountTier.toString()"
          >
            <p class="flex items-baseline gap-3">
              <span class="font-bold text-lg">{{ membership.name }}</span>

              <span class="font-mono text-xs"
                >( {{ formatCurrency(membership.price, membership.currency) }} /
                {{ membership.frequency }})</span
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
      </div>

      <div v-else class="text-center my-8 flex items-center gap-4">
        <span>
          <i class="fas fa-exclamation-triangle text-danger text-4xl"></i>
        </span>
        <div class="space-y-3">
          <p class="text-lg font-bold">
            Uh oh! We seem to be having trouble retrieving membership data.
            Please try again later. 😢
          </p>
          <FormButton @click="onCancelChangeAccountType">Cancel</FormButton>
        </div>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import { AccountTier, ListMembershipsResponseDTO } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../../api-client';
import { useOops } from '../../../oops';
import FormButton from '../../common/form-button.vue';
import FormRadio from '../../common/form-radio.vue';
import LoadingSpinner from '../../common/loading-spinner.vue';

interface MembershipFormProps {
  accountTier: AccountTier;
  isSaving?: boolean;
}

interface MembershipFormState {
  accountTier: string;
  isLoading: boolean;
  memberships: ListMembershipsResponseDTO | null;
}

const client = useClient();
const oops = useOops();

const props = withDefaults(defineProps<MembershipFormProps>(), {
  isSaving: false,
});
const state = reactive<MembershipFormState>({
  accountTier: props.accountTier.toString(),
  isLoading: true,
  memberships: null,
});

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
  emit('change-membership', parseInt(state.accountTier, 10));
}

function onCancelChangeAccountType() {
  emit('cancel');
}

onMounted(async () => {
  await oops(
    async () => {
      state.memberships = await client.memberships.listMemberships();
    },
    {
      default: () => {
        state.memberships = null;
      },
    },
  );

  state.isLoading = false;
});
</script>
