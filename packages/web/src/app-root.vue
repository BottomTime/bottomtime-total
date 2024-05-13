<template>
  <SnackBar />
  <div
    class="md:container mx-auto font-content text-grey-900 bg-blue-200 dark:text-grey-100 dark:bg-blue-950 rounded-b-xl shadow-md shadow-white dark:shadow-grey-700 opacity-95"
  >
    <section class="mt-16 p-4">
      <RouterView></RouterView>
    </section>
    <PageFooter />
  </div>
  <NavBar />
</template>

<script setup lang="ts">
import { onBeforeMount, onServerPrefetch, useSSRContext } from 'vue';

import { ToastType } from './common';
import NavBar from './components/core/nav-bar.vue';
import PageFooter from './components/core/page-footer.vue';
import SnackBar from './components/core/snack-bar.vue';
import { Config } from './config';
import { AppInitialState, useInitialState } from './initial-state';
import { useCurrentUser, useToasts } from './store';

const currentUser = useCurrentUser();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : undefined;
const initialState = useInitialState();
const toasts = useToasts();

onServerPrefetch(async () => {
  currentUser.user = ctx?.currentUser ?? null;
});

onBeforeMount(() => {
  if (!Config.isSSR) {
    currentUser.user = initialState?.currentUser ?? null;

    if (initialState?.error && initialState.error instanceof Error) {
      toasts.toast({
        id: 'server-error',
        message: Config.isProduction
          ? 'A server error has occurred.'
          : initialState.error.message,
        type: ToastType.Error,
      });
    }
  }
});
</script>
