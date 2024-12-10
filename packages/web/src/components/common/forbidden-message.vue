<template>
  <div data-testid="forbidden-message">
    <div class="grid grid-cols-1 md:grid-cols-5">
      <div class="md:col-start-2 md:col-span-3 p-3 rounded-md">
        <TextHeading>Unauthorized</TextHeading>

        <div class="flex flex-row gap-6 mb-6 justify-start">
          <span class="mt-2">
            <i class="fas fa-hand-paper fa-2x text-danger"></i>
          </span>

          <div data-testid="require-auth-unauthorized">
            <p class="mb-3">
              <span class="font-bold">Stop!</span>
              <span> You are not authorized to view this page.</span>
            </p>
            <p>
              You can return to the
              <RouterLink to="/">home page</RouterLink> or navigate to where you
              want to be using the nav bar at the top of the page.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router';

import TextHeading from './text-heading.vue';
</script>
