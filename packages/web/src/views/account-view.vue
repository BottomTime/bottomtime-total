<template>
  <PageTitle title="Manage Account" />
  <RequireAuth>
    <div class="grid grid-cols-1 md:grid-cols-5">
      <FormBox class="md:col-start-2 md:col-span-3">
        <ManageAccount
          :user="currentUser.user!"
          :membership="currentUser.membership"
          @change-username="onChangeUsername"
          @change-email="onChangeEmail"
          @change-password="onChangePassword"
          @change-membership="onChangeMembership"
        />
      </FormBox>
    </div>
  </RequireAuth>
</template>

<script setup lang="ts">
import { MembershipStatusDTO } from '@bottomtime/api';

import FormBox from '../components/common/form-box.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import ManageAccount from '../components/users/manage-account.vue';
import { useCurrentUser } from '../store';

const currentUser = useCurrentUser();

function onChangeUsername(username: string) {
  if (currentUser.user) {
    currentUser.user.username = username;
  }
}

function onChangeEmail(email: string) {
  if (currentUser.user) {
    currentUser.user.email = email;
    currentUser.user.emailVerified = false;
  }
}

function onChangePassword() {
  if (currentUser.user) {
    currentUser.user.hasPassword = true;
    currentUser.user.lastPasswordChange = new Date();
  }
}

function onChangeMembership(membership: MembershipStatusDTO) {
  currentUser.membership = membership;
}
</script>
