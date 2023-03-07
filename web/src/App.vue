<template>
  <div v-if="isLoading"></div>
  <div v-else>
    <SnackBar />
    <NavBar />
    <RouterView />
    <PageFooter />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue';

import { Dispatch, useStore } from '@/store';
import { inject } from './helpers';
import NavBar from '@/components/main/NavBar.vue';
import PageFooter from '@/components/main/PageFooter.vue';
import SnackBar from '@/components/main/SnackBar.vue';
import { UserManagerKey } from '@/injection-keys';

const userManager = inject(UserManagerKey);
const store = useStore();
const isLoading = ref(true);

onBeforeMount(async () => {
  try {
    const currentUser = await userManager.getCurrentUser();
    if (currentUser) {
      await store.dispatch(Dispatch.SignInUser, currentUser);
    }
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style>
@import './assets/bulmaswatch.min.css';
</style>
