<template>
  <PageTitle title="Import Logs" />
  <BreadCrumbs :items="breadcrumbs" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Breadcrumb } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import PageTitle from '../../components/common/page-title.vue';

const route = useRoute();

const breadcrumbs = computed<Breadcrumb[]>(() => [
  { label: 'Logbook', to: `/logbook/${route.params.username}` },
  { label: 'Import Logs', active: true },
]);
</script>
