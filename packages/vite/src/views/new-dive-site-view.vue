<template>
  <PageTitle title="Create Dive Site" />
  <BreadCrumbs :items="Breadcrumbs" />
  <RequireAuth>
    <EditDiveSite :site="site" />
  </RequireAuth>
  <div></div>
</template>

<script lang="ts" setup>
import { DiveSiteDTO } from '@bottomtime/api';

import { ref } from 'vue';

import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import EditDiveSite from '../components/diveSites/edit-dive-site.vue';

const Breadcrumbs: Breadcrumb[] = [
  { label: 'Dive Sites', to: '/diveSites' },
  { label: 'Create Dive Site', active: true },
];

const site = ref<DiveSiteDTO>({
  createdOn: new Date(),
  creator: { userId: '', username: '', memberSince: new Date() },
  id: '',
  name: '',
  location: '',
});

function onSiteCreated(newSite: DiveSiteDTO) {
  site.value = newSite;
  location.assign(`/diveSites/${newSite.id}`);
}
</script>
