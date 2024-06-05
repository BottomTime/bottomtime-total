<template>
  <PageTitle title="Create Tank Profile" />
  <BreadCrumbs :items="breadcrumbs" />
  <EditTank :tank="state.tank" :is-saving="state.isSaving" @save="onSave" />
</template>

<script lang="ts" setup>
import { TankDTO, TankMaterial } from '@bottomtime/api';

import { reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import EditTank from '../components/tanks/edit-tank.vue';
import { useLocation } from '../location';
import { useOops } from '../oops';

interface ProfileNewTankViewState {
  isSaving: boolean;
  tank: TankDTO;
}

const client = useClient();
const location = useLocation();
const oops = useOops();
const route = useRoute();

const breadcrumbs: Breadcrumb[] = [
  {
    label: 'Profile',
    to: `/profile/${route.params.username}`,
  },
  {
    label: 'Tank Profiles',
    to: `/profile/${route.params.username}/tanks`,
  },
  {
    label: 'Create Tank Profile',
    active: true,
  },
];

const state = reactive<ProfileNewTankViewState>({
  isSaving: false,
  tank: {
    id: '',
    isSystem: false,
    volume: 0,
    name: '',
    workingPressure: 0,
    material: TankMaterial.Aluminum,
  },
});

async function onSave(dto: TankDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    const username = route.params.username as string;
    const tank = await client.tanks.createTank(dto, username);
    location.assign(`/profile/${username}/tanks/${tank.id}`);
  });

  state.isSaving = false;
}
</script>
