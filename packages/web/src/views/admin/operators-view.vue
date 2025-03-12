<template>
  <PageTitle title="Manage Dive Shops" />
  <BreadCrumbs :items="BreadcrumbItems" />
</template>

<script setup lang="ts">
import { Breadcrumb } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import PageTitle from '../../components/common/page-title.vue';

const BreadcrumbItems: Breadcrumb[] = [
  {
    label: 'Admin',
    to: '/admin',
  },
  {
    label: 'Manage Dive Shops',
    active: true,
  },
] as const;
</script>
