<template>
  <div class="space-y-8">
    <p class="text-success text-5xl">
      <i class="fas fa-check-circle"></i>
    </p>

    <TextHeading>Success!</TextHeading>

    <p>
      Your membership is <span class="font-bold">active</span> and you can begin
      enjoying the benefits of it. You will be redirected back to your account
      page in a few seconds.
    </p>

    <div data-testid="active-membership-tier">
      <TextHeading level="h3">Membership Tier</TextHeading>
      <p>{{ currentMembership }}</p>
    </div>

    <div v-if="membershipStatus.nextBillingDate">
      <TextHeading level="h3">Next Billing Date</TextHeading>
      <p>{{ nextBillingDateString }}</p>
    </div>

    <p>
      <FormButton
        type="primary"
        test-id="btn-return-to-account"
        @click="doRedirect"
      >
        Redirecting back to account page in
        {{ countdown }} seconds...
      </FormButton>
    </p>
  </div>
</template>

<script lang="ts" setup>
import {
  ListMembershipsResponseDTO,
  MembershipStatusDTO,
} from '@bottomtime/api';

import dayjs from 'src/dayjs';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import FormButton from '../../common/form-button.vue';
import TextHeading from '../../common/text-heading.vue';

interface ActiveMembershipProps {
  memberships: ListMembershipsResponseDTO;
  membershipStatus: MembershipStatusDTO;
}

const router = useRouter();

const props = defineProps<ActiveMembershipProps>();
const nextBillingDateString = computed(() =>
  dayjs(props.membershipStatus.nextBillingDate).format('LL'),
);

const countdown = ref(10);
const currentMembership = computed(
  () =>
    props.memberships.find(
      (m) => m.accountTier === props.membershipStatus.accountTier,
    )?.name ?? 'Unknown',
);

async function doRedirect() {
  await router.push('/account');
}

function startRedirectTimer() {
  const countdownTick = () => {
    countdown.value -= 1;
    if (countdown.value > 0) {
      setTimeout(countdownTick, 1000);
    } else {
      doRedirect();
    }
  };
  setTimeout(countdownTick, 1000);
}

onMounted(startRedirectTimer);
</script>
