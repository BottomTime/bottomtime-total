<template>
  <PageTitle title="Admin Dashboard" subtitle="Manage Users" />
  <RequireAuth :role="RequiredRole">
    <UsersList />
  </RequireAuth>
</template>

<script setup lang="ts">
import { UserRole } from '@bottomtime/api';

import UsersList from '../components/admin/users-list.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';

const RequiredRole = UserRole.Admin;
</script>
