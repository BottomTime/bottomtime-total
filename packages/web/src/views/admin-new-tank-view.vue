<template>
  <PageTitle :title="title" />
  <RequireAuth :role="UserRole.Admin">
    <BreadCrumbs :items="Breadcrumbs" />
    <EditTank
      class="mt-6"
      :tank="state.tank"
      :is-saving="state.isSaving"
      @save="onSave"
    />
  </RequireAuth>
</template>

<script lang="ts" setup>
import { TankDTO, TankMaterial, UserRole } from '@bottomtime/api';

import { reactive } from 'vue';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import EditTank from '../components/admin/edit-tank.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import { useLocation } from '../location';
import { useOops } from '../oops';

interface AdminNewTankViewState {
  isSaving: boolean;
  tank: TankDTO;
}

const client = useClient();
const location = useLocation();
const oops = useOops();

const title = 'Create Tank Profile';
const Breadcrumbs: Breadcrumb[] = [
  {
    label: 'Admin',
    to: '/admin',
  },
  {
    label: 'Manage Tank Profiles',
    to: '/admin/tanks',
  },
  {
    label: title,
    active: true,
  },
];

const state = reactive<AdminNewTankViewState>({
  isSaving: false,
  tank: {
    id: '',
    isSystem: true,
    name: '',
    material: TankMaterial.Aluminum,
    volume: 0,
    workingPressure: 0,
  },
});

async function onSave(dto: TankDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    const { id } = await client.tanks.createTank(dto);
    location.assign(`/admin/tanks/${id}`);
  });

  state.isSaving = false;
}
</script>
