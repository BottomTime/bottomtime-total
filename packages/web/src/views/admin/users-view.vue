<template>
  <PageTitle title="Admin Dashboard" subtitle="Manage Users" />
  <RequireAuth :authorizer="authorizer">
    <BreadCrumbs :items="breadcrumbs" />
    <UsersList />
  </RequireAuth>
</template>

<script setup lang="ts">
import { UserDTO, UserRole } from '@bottomtime/api';

import { Breadcrumb } from '../../common';
import UsersList from '../../components/admin/users-list.vue';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth2.vue';

const breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Users', active: true },
];

function authorizer(user?: UserDTO): boolean {
  return user?.role === UserRole.Admin;
}
</script>
