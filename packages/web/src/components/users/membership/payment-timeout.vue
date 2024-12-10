<template>
  <div class="space-y-8">
    <p class="text-warn text-5xl">
      <i class="fa-regular fa-clock"></i>
    </p>

    <TextHeading>Payment Timeout</TextHeading>

    <p>
      Our payment provider is taking longer than usual to process your payment.
      This is likely a temporary issue. Check your
      <RouterLink to="/account">account page</RouterLink> in a few minutes to
      see if your membership status has been updated. (You should also receive
      an email confirmation.)
    </p>

    <p>
      If after several minutes you don't see any changes and haven't received
      any emails then please contact us at
      <a :href="`mailto:${adminEmail}`">
        {{ adminEmail }}
      </a>
      .
    </p>

    <p>Thank you for your patience!</p>

    <div class="flex justify-evenly">
      <RouterLink to="/">Return to Home Page</RouterLink>
      <RouterLink to="/account">Return to Account Page</RouterLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { Config } from '../../../config';
import TextHeading from '../../common/text-heading.vue';

const adminEmail = computed(() => Config.adminEmail);
</script>
