<template>
  <div class="space-y-8">
    <p class="text-danger text-5xl">
      <i class="fa-solid fa-circle-exclamation"></i>
    </p>

    <TextHeading>Error</TextHeading>

    <p>
      An error occurred while attempting to process your order. Please try again
      later. If the problem persists, please contact us at
      <NavLink :to="`mailto:${adminEmail}`">
        {{ adminEmail }}
      </NavLink>
      .
    </p>

    <div class="flex justify-evenly">
      <NavLink to="/">Return to Home Page</NavLink>
      <NavLink to="/account">Return to Account Page</NavLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { Config } from '../../../config';
import NavLink from '../../common/nav-link.vue';
import TextHeading from '../../common/text-heading.vue';

const adminEmail = computed(() => Config.adminEmail);
</script>
