<template>
  <div class="space-y-8">
    <p class="text-danger text-5xl">
      <i class="fa-solid fa-circle-exclamation"></i>
    </p>

    <TextHeading>Error</TextHeading>

    <p>
      An error occurred while attempting to process your order. Please try again
      later. If the problem persists, please contact us at
      <a :href="`mailto:${adminEmail}`">
        {{ adminEmail }}
      </a>
      .
    </p>

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
