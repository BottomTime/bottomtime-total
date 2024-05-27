<template>
  <PageTitle title="Create Dive Site" />
  <BreadCrumbs :items="Breadcrumbs" />
  <RequireAuth>
    <CreateSiteWizard :is-saving="isSaving" offset-top @save="onSiteSaved" />
  </RequireAuth>
</template>

<script lang="ts" setup>
import { CreateOrUpdateDiveSiteDTO } from '@bottomtime/api';

import { ref } from 'vue';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import CreateSiteWizard from '../components/diveSites/create-site-wizard.vue';
import { useLocation } from '../location';
import { useOops } from '../oops';

const Breadcrumbs: Breadcrumb[] = [
  { label: 'Dive Sites', to: '/diveSites' },
  { label: 'Create Dive Site', active: true },
];

const client = useClient();
const oops = useOops();
const location = useLocation();

const isSaving = ref(false);

async function onSiteSaved(dto: CreateOrUpdateDiveSiteDTO): Promise<void> {
  isSaving.value = true;

  await oops(async () => {
    const site = await client.diveSites.createDiveSite(dto);
    location.assign(`/diveSites/${site.id}`);
  });

  isSaving.value = false;
}
</script>
