<template>
  <SnackBar />
  <div
    id="modal"
    class="font-content text-grey-900 bg-blue-200 dark:text-grey-100 dark:bg-blue-950"
  ></div>
  <div id="drawer"></div>

  <div
    class="md:container mx-auto font-content text-grey-900 bg-blue-200 dark:text-grey-100 dark:bg-blue-950 rounded-b-xl shadow-md shadow-white dark:shadow-grey-700 opacity-95"
  >
    <!-- Placeholder element. Modal dialogs will be "teleported" here to get the z-indexing right. -->

    <section class="mt-16 p-4">
      <div v-if="isLoading" class="flex justify-center text-4xl">
        <LoadingSpinner message="Loading app..." />
      </div>
      <RouterView v-else></RouterView>
    </section>
    <PageFooter />
  </div>
  <NavBar />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useClient } from './api-client';
import LoadingSpinner from './components/common/loading-spinner.vue';
import NavBar from './components/core/nav-bar.vue';
import PageFooter from './components/core/page-footer.vue';
import SnackBar from './components/core/snack-bar.vue';
import { useOops } from './oops';
import { useCurrentUser } from './store';
import './style.css';

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();

const isLoading = ref(true);

onMounted(async () => {
  await oops(async () => {
    const user = await client.users.getCurrentUser();
    currentUser.user = user?.toJSON() ?? null;
  });

  isLoading.value = false;
});
</script>
