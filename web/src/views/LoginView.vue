<template>
  <PageTitle title="Login" />
  <section class="section">
    <div v-if="currentUser" class="container">
      <p class="content block">
        It looks like you're already signed in. Did you mean to
        <a href="/api/auth/logout">logout</a> and log in with a different
        account?
      </p>
      <p class="content block">
        If not, you can try returning to the
        <RouterLink to="/">home page</RouterLink> to try and find what you're
        looking for.
      </p>
    </div>
    <div v-else id="login-page" class="container">
      <LoginForm />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import LoginForm from '@/components/users/LoginForm.vue';
import PageTitle from '@/components/PageTitle.vue';
import { useStore } from '@/store';

const store = useStore();
const currentUser = computed(() => store.state.currentUser);
</script>
