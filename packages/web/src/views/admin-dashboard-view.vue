<template>
  <PageTitle title="Admin Dashboard" />
  <RequireAuth :role="RequiredRole">
    <BreadCrumbs :items="breadcrumbs" />
    <div class="font-bold">TODO: Make a sweet dashboard</div>
    <div class="grid">
      <div>
        <NavLink to="/admin/users">Manage Users</NavLink>
      </div>
    </div>
  </RequireAuth>
</template>

<script setup lang="ts">
import { UserRole } from '@bottomtime/api';

import { computed } from 'vue';

import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NavLink from '../components/common/nav-link.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';

const breadcrumbs: Breadcrumb[] = [{ label: 'Admin', active: true }];
const RequiredRole = computed(() => UserRole.Admin);
</script>
