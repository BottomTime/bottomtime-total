<template>
  <PageTitle title="Import Logs" />
  <BreadCrumbs :items="breadcrumbs" />

  <div>Recent Imports</div>
  <div>Here is a list of your recent imports.</div>

  <div>Start An Import</div>
  <FormButton>Upload file...</FormButton>
  <FormButton>Connect a site...</FormButton>
  <FormButton>Upload directly from computer...</FormButton>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Breadcrumb } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import FormButton from '../../components/common/form-button.vue';
import PageTitle from '../../components/common/page-title.vue';

const route = useRoute();

const breadcrumbs = computed<Breadcrumb[]>(() => [
  { label: 'Logbook', to: `/logbook/${route.params.username}` },
  { label: 'Import Logs', active: true },
]);
</script>
