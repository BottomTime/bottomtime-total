<template>
  <PageTitle title="Manage Alerts" />
  <BreadCrumbs :items="Breadcrumbs" />

  <AlertsList />
</template>

<script lang="ts" setup>
import { Breadcrumb } from '../common';
import AlertsList from '../components/admin/alerts-list.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';

const Breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Manage Alerts', active: true },
];
</script>
