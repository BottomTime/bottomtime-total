<template>
  <div v-if="isLoading"></div>
  <div v-else>
    <SnackBar />
    <NavBar />
    <RouterView />
    <PageFooter />
    <CookieWarning />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue';

import CookieWarning from './components/main/CookieWarning.vue';
import { Dispatch, useStore } from '@/store';
import { inject } from '@/helpers';
import NavBar from '@/components/main/NavBar.vue';
import PageFooter from '@/components/main/PageFooter.vue';
import SnackBar from '@/components/main/SnackBar.vue';
import { ApiClientKey } from '@/injection-keys';

const client = inject(ApiClientKey);
const store = useStore();
const isLoading = ref(true);

onBeforeMount(async () => {
  try {
    const currentUser = await client.users.getCurrentUser();
    await store.dispatch(Dispatch.SignInUser, currentUser);
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
