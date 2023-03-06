<template>
  <NavBar />
  <RouterView />
  <PageFooter />
</template>

<script lang="ts" setup>
import NavBar from '@/components/main/NavBar.vue';
import PageFooter from '@/components/main/PageFooter.vue';
</script>

<style>
@import './assets/bulmaswatch.min.css';
</style>
