<template>
  <PageTitle :title="pageTitle">
    <nav class="breadcrumb">
      <ul>
        <li>
          <RouterLink to="/diveSites">Dive Sites</RouterLink>
        </li>
        <li class="is-active">
          <a href="#">{{ pageTitle }}</a>
        </li>
      </ul>
    </nav>
  </PageTitle>
  <section class="section">
    <div id="dive-site-page" class="container">
      <div>TODO: Render a page to show the dive site!</div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import PageTitle from '@/components/PageTitle.vue';

const pageTitle = computed(() => 'Dive Site');

onMounted(async () => {
  // TODO: Get the dive site.
});
</script>
