<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="Breadcrumbs" />

  <div class="grid grid-cols-1 xl:grid-cols-5">
    <FormBox class="xl:col-start-2 xl:col-span-3">
      <EditAlert :alert="alert" />
    </FormBox>
  </div>
</template>

<script lang="ts" setup>
import { AlertDTO } from '@bottomtime/api';

import { computed, ref } from 'vue';

import { Breadcrumb } from '../common';
import EditAlert from '../components/admin/edit-alert.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import FormBox from '../components/common/form-box.vue';
import PageTitle from '../components/common/page-title.vue';

const title = computed(() => 'New Alert');
const Breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Alerts', to: '/admin/alerts' },
  { label: () => title.value, active: true },
];

const alert = ref<AlertDTO>({
  id: '',
  icon: '',
  title: '',
  message: '',
});
</script>
