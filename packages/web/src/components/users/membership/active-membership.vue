<template>
  <div class="space-y-8">
    <p class="text-success">
      <i class="fas fa-check-circle text-5xl text-green-500"></i>
    </p>

    <TextHeading>Success!</TextHeading>

    <p>
      Your new membership is now active and you can begin enjoying the benefits
      of it. You will be redirected back to the account page in a few seconds.
    </p>

    <div>
      <TextHeading level="h3">Membership Tier</TextHeading>
      <p>{{ membership.name }}</p>
    </div>

    <div>
      <TextHeading level="h3">Next Billing Date</TextHeading>
      <p>{{ nextBillingDateString }}</p>
    </div>

    <p>
      <FormButton type="primary" @click="doRedirect">
        Redirecting back to account page in
        {{ countdown }} seconds...
      </FormButton>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { MembershipDTO, MembershipStatusDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed, onMounted, ref } from 'vue';

import { useLocation } from '../../../location';
import FormButton from '../../common/form-button.vue';
import TextHeading from '../../common/text-heading.vue';

interface ActiveMembershipProps {
  membership: MembershipDTO;
  membershipStatus: MembershipStatusDTO;
}

const location = useLocation();

const props = defineProps<ActiveMembershipProps>();
const nextBillingDateString = computed(() =>
  dayjs(props.membershipStatus.nextBillingDate).format('LL'),
);

const countdown = ref(10);

function doRedirect() {
  location.assign('/account');
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
