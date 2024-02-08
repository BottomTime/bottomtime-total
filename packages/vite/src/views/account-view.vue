<template>
  <PageTitle title="Manage Account" />
  <RequireAuth>
    <div class="grid grid-cols-1 md:grid-cols-5">
      <FormBox class="md:col-start-2 md:col-span-3">
        <ManageAccount :user="currentUser.user" />
      </FormBox>
    </div>
  </RequireAuth>
</template>

<script setup lang="ts">
import FormBox from '../components/common/form-box.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import ManageAccount from '../components/users/manage-account.vue';
import { useCurrentUser } from '../store';

const currentUser = useCurrentUser();
</script>
