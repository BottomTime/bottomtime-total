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

import NavBar from './components/core/nav-bar.vue';
import PageFooter from './components/core/page-footer.vue';
import SnackBar from './components/core/snack-bar.vue';
import { Config } from './config';
import { useCurrentUser } from './store';

const currentUser = useCurrentUser();

// On the server-side, the initial state will be provided as the SSR context.
onServerPrefetch(() => {
  const initialState = useSSRContext();
  currentUser.user = initialState.currentUser;
  initialState.extra = { exists: true };
});

// Initial state will also be serialized into the HTML by the server. We can access it on the `window`
// object on the client-side.
onBeforeMount(() => {
  if (!Config.isSSR) {
    const appState = window.__INITIAL_STATE__;
    currentUser.user = appState.currentUser;
  }
});
</script>
