<template>
  <SnackBar />
  <div
    class="md:container mx-auto font-content text-grey-900 bg-blue-200 rounded-b-xl shadow-md shadow-white opacity-90"
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
import { useCurrentUser } from './store';
import { AppInitialState } from './common';
import { Config } from './config';

const currentUser = useCurrentUser();

// On the server-side, the initial state will be provided as the SSR context.
onServerPrefetch(() => {
  const initialState = useSSRContext() as AppInitialState;
  currentUser.user = initialState.currentUser;
});

// Initial state will also be serialized into the HTML by the server. We can access it on the `window`
// object on the client-side.
onBeforeMount(() => {
  if (!Config.isServerSide) {
    const appState: AppInitialState = (window as any).__INITIAL_STATE__;
    currentUser.user = appState.currentUser;
  }
});
</script>
