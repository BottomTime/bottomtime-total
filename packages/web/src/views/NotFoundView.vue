<template>
  <PageTitle title="Page Not Found" />
  <section class="section">
    <div class="container">
      <NotFound />
    </div>
  </section>
</template>

<script lang="ts" setup>
import PageTitle from '@/components/PageTitle.vue';
import NotFound from '@/components/errors/NotFound.vue';
</script>
