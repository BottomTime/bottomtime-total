<template>
  <div v-if="isLoading"></div>
  <div v-else>
    <NavBar />
    <RouterView />
    <PageFooter />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue';
import { useStore } from 'vuex';

import { inject } from './helpers';
import NavBar from '@/components/main/NavBar.vue';
import PageFooter from '@/components/main/PageFooter.vue';
import { StoreKey, UserManagerKey } from '@/injection-keys';
import { Dispatch } from '@/store';

const userManager = inject(UserManagerKey);
const store = useStore(StoreKey);
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
