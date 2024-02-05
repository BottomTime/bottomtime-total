<template>
  <PageTitle title="Admin Dashboard" subtitle="Manage Users" />
  <UsersList />
</template>

<script setup lang="ts">
import UsersList from '../components/admin/users-list.vue';
import PageTitle from '../components/common/page-title.vue';
</script>
