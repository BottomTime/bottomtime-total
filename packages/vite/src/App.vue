<template>
  <SnackBar />
  <NavBar />
  <div
    class="md:container mx-auto font-content p-4 text-grey-900 bg-blue-200 rounded-b-xl shadow-md shadow-white opacity-90"
  >
    <section class="pb-6">
      <RouterView></RouterView>
    </section>
    <PageFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onServerPrefetch } from 'vue';
import NavBar from './components/core/nav-bar.vue';
import PageFooter from './components/core/page-footer.vue';
import SnackBar from './components/core/snack-bar.vue';
import { useClient } from './client';
import { useCurrentUser } from './store';

const client = useClient();
const store = useCurrentUser();

let gotCurrentUser = false;

async function getCurrentUser(): Promise<void> {
  try {
    const currentUser = await client.users.getCurrentUser();
    store.currentUser = currentUser;
  } catch (e) {
    console.error(e.message);
  }
}

onMounted(async () => {
  if (!gotCurrentUser) {
    await getCurrentUser();
    gotCurrentUser = true;
  }
});

onServerPrefetch(async () => {
  await getCurrentUser();
  gotCurrentUser = true;
});
</script>
