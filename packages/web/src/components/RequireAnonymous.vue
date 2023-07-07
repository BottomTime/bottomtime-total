<template>
  <div id="user-logged-in-content" v-if="currentUser" class="container">
    <p class="content block">
      It looks like you're already signed in. Did you mean to
      <a href="/api/auth/logout">logout</a> and log in with a different account?
    </p>
    <p class="content block">
      If not, you can try returning to the
      <RouterLink to="/">home page</RouterLink> to try and find what you're
      looking for.
    </p>
  </div>
  <slot v-else></slot>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useStore } from '@/store';

const store = useStore();
const currentUser = computed(() => store.state.currentUser);
</script>
