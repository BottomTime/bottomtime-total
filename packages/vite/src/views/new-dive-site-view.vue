<template>
  <PageTitle title="Create Dive Site" />
  <BreadCrumbs :items="Breadcrumbs" />
  <RequireAuth>
    <EditDiveSite :site="site" @site-updated="onSiteCreated" />
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
import { useLocation } from '../location';

const Breadcrumbs: Breadcrumb[] = [
  { label: 'Dive Sites', to: '/diveSites' },
  { label: 'Create Dive Site', active: true },
];

const location = useLocation();

const site = ref<DiveSiteDTO>({
  createdOn: new Date(),
  creator: { userId: '', username: '', memberSince: new Date() },
  id: '',
  name: '',
  location: '',
});

function onSiteCreated(newSite: DiveSiteDTO) {
  site.value = newSite;
  // Redirect after two seconds... this gives the user a chance to see the success toast.
  setTimeout(() => {
    location.assign(`/diveSites/${newSite.id}`);
  }, 2000);
}
</script>
