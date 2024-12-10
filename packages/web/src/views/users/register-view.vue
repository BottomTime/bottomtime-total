<template>
  <ConfirmDialog
    title="Log out?"
    icon="fas fa-question-circle fa-2x text-blue-400 mr-4"
    confirm-text="Log out"
    :visible="showConfirmLogout"
    @cancel="showConfirmLogout = false"
    @confirm="onLogout"
  >
    <p>Are you sure you want to log out? This will end your current session.</p>
  </ConfirmDialog>
  <PageTitle title="Register" />

  <!-- Only show the form if the user is not currently logged in. -->
  <RegisterForm v-if="currentUser.anonymous" />

  <!-- Show some helpful text instead if the user is already logged in. -->
  <div v-else class="flex flex-row align-top" data-testid="require-anonymous">
    <span class="text-warn mr-4 mt-2">
      <i class="fas fa-exclamation fa-2x"></i>
    </span>
    <div>
      <p class="mb-3">
        It looks like you are trying to create a new account but you are already
        signed in. If you are here by mistake, try navigating back to the
        <RouterLink to="/">home page</RouterLink> or navigating to where you
        want to be using the nav bar at the top of the page.
      </p>
      <p>
        If you are interested in creating a new account, you must first log out
        and then return to this page. Click
        <RouterLink to="#" @click="showConfirmLogout = true">here</RouterLink>
        to log out.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

import { useClient } from '../../api-client';
import PageTitle from '../../components/common/page-title.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import RegisterForm from '../../components/users/register-form.vue';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const showConfirmLogout = ref(false);

async function onLogout() {
  await oops(async () => {
    await client.users.logout();
    currentUser.user = null;
  });
}
</script>
