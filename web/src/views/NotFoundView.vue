<template>
  <PageTitle title="Page Not Found" />
  <section class="section">
    <div id="not-found-page" class="container">
      <p class="content block">
        Sorry, the page you were looking for cannot be found here. Check the URL
        to see that it is correct or try returning to the
        <RouterLink to="/">home page</RouterLink> to find what you are looking
        for.
      </p>
    </div>
  </section>
</template>

<script lang="ts" setup>
import PageTitle from '@/components/PageTitle.vue';
</script>
