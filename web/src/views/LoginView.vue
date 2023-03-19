<template>
  <PageTitle title="Login" />
  <section class="section">
    <div
      v-if="currentUser"
      id="user-already-authenticated-page"
      class="container"
    >
      <UserAlreadyLoggedIn />
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
import UserAlreadyLoggedIn from '@/components/users/UserAlreadyLoggedIn.vue';
import { useStore } from '@/store';

const store = useStore();
const currentUser = computed(() => store.state.currentUser);
</script>
