<template>
  <PageTitle title="Sign Up" />
  <section class="section">
    <div
      v-if="currentUser"
      id="user-already-authenticated-page"
      class="container"
    >
      <UserAlreadyLoggedIn />
    </div>

    <div v-else id="signup-page" class="container">
      <div class="columns">
        <div class="column is-offset-one-quarter-tablet is-half-tablet">
          <SignupForm />
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import PageTitle from '@/components/PageTitle.vue';
import SignupForm from '@/components/users/SignUpForm.vue';
import UserAlreadyLoggedIn from '@/components/users/UserAlreadyLoggedIn.vue';
import { useStore } from '@/store';

const store = useStore();
const currentUser = computed(() => store.state.currentUser);
</script>
