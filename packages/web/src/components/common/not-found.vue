<template>
  <div class="text-center" data-testid="not-found-message">
    <p class="text-lg mb-5">
      Uh oh! The page you are looking for could not be found. Check your URL or
      click <RouterLink to="/">here</RouterLink> to go back to the home page.
    </p>

    <p>
      <img
        class="rounded-lg drop-shadow-md block m-auto w-1/2"
        src="/img/diver_lost.jpeg"
        alt=""
        aria-hidden="true"
      />
    </p>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>
