<template>
  <slot v-if="currentUser"></slot>
  <div v-else class="container">
    <div class="block">Please sign in to proceed.</div>

    <div class="block">
      <LoginForm />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import LoginForm from '@/components/users/LoginForm.vue';
import { useStore } from '@/store';

const store = useStore();
const currentUser = computed(() => store.state.currentUser);
</script>
