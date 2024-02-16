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

import { useClient } from './client';
import { AppInitialState } from './common';
import NavBar from './components/core/nav-bar.vue';
import PageFooter from './components/core/page-footer.vue';
import SnackBar from './components/core/snack-bar.vue';
import { Config } from './config';
import { useInitialState } from './initial-state';
import { useOops } from './oops';
import { useCurrentUser } from './store';

const client = useClient();
const currentUser = useCurrentUser();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : undefined;
const oops = useOops();

onServerPrefetch(async () => {
  await client.users.getCurrentUser();
  const user = await oops(async () => {
    const user = await client.users.getCurrentUser();
    return user?.toJSON() ?? null;
  });
  if (ctx) ctx.currentUser = user;
  currentUser.user = user;
});

onBeforeMount(() => {
  if (!Config.isSSR) {
    const initialState = useInitialState();
    currentUser.user = initialState?.currentUser ?? null;
  }
});
</script>
