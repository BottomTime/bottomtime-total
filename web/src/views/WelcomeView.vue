<template>
  <PageTitle
    title="Welcome!"
    subtitle="...take a moment to setup your account!"
  />
  <section class="section">
    <div id="welcome-page" class="container">
      <p class="content block">Welcome to BottomTime,</p>

      <p>
        Your new account has been created with username
        <strong>{{ currentUser?.username }}</strong
        >.
      </p>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import PageTitle from '@/components/PageTitle.vue';
import { useStore } from '@/store';

const store = useStore();
const currentUser = computed(() => store.state.currentUser);
</script>
