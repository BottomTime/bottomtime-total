<template>
  <PageTitle title="Admin Dashboard" subtitle="Manage Users" />
  <RequireAuth :role="RequiredRole">
    <BreadCrumbs :items="breadcrumbs" />
    <UsersList />
  </RequireAuth>
</template>

<script setup lang="ts">
import { UserRole } from '@bottomtime/api';

import { Breadcrumb } from '../common';
import UsersList from '../components/admin/users-list.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';

const breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Users', active: true },
];

const RequiredRole = UserRole.Admin;
</script>
