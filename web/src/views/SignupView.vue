<template>
  <PageTitle title="Sign Up" />
  <section class="section">
    <div v-if="currentUser" class="container">
      <p>Lol Wat?</p>
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
import { useStore } from '@/store';

const store = useStore();
const currentUser = computed(() => store.state.currentUser);
</script>
