<template>
  <div v-if="enableDiveOperators.value">
    <PageTitle title="Create Dive Shop" />
    <BreadCrumbs :items="Breadcrumbs" />
    <EditDiveOperator :is-saving="isSaving" @save="onSave" />
  </div>

  <NotFound v-else />
</template>

<script setup lang="ts">
import { CreateOrUpdateDiveOperatorDTO } from '@bottomtime/api';
import { ManageDiveOperatorsFeature } from '@bottomtime/common';

import { ref } from 'vue';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import EditDiveOperator from '../components/operators/edit-dive-operator.vue';
import { useFeature } from '../featrues';
import { useLocation } from '../location';
import { useOops } from '../oops';

const Breadcrumbs: Breadcrumb[] = [
  {
    label: 'Dive Shops',
    to: '/shops',
  },
  {
    label: 'Create Dive Shop',
    active: true,
  },
] as const;

const client = useClient();
const enableDiveOperators = useFeature(ManageDiveOperatorsFeature);
const location = useLocation();
const oops = useOops();

const isSaving = ref(false);

async function onSave(dto: CreateOrUpdateDiveOperatorDTO): Promise<void> {
  isSaving.value = true;

  await oops(
    async () => {
      const operator = await client.diveOperators.createDiveOperator(dto);
      location.assign(`/shops/${operator.slug}`);
    },
    {
      [409]: () => {
        // TODO: Conflict!
      },
    },
  );

  isSaving.value = false;
}
</script>
