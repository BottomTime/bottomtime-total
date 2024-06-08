<template>
  <PageTitle title="Create Tank Profile" />
  <BreadCrumbs :items="breadcrumbs" />
  <RequireAuth
    :auth-check="
      (currentUser) =>
        currentUser.role === UserRole.Admin ||
        currentUser.username.toLowerCase() === username.toLowerCase()
    "
  >
    <EditTank :tank="state.tank" :is-saving="state.isSaving" @save="onSave" />
  </RequireAuth>
</template>

<script lang="ts" setup>
import { TankDTO, TankMaterial, UserRole } from '@bottomtime/api';

import { computed, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import EditTank from '../components/tanks/edit-tank.vue';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useToasts } from '../store';

interface ProfileNewTankViewState {
  isSaving: boolean;
  tank: TankDTO;
}

const client = useClient();
const location = useLocation();
const oops = useOops();
const route = useRoute();
const toasts = useToasts();

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

const username = computed(() => route.params.username as string);

async function onSave(dto: TankDTO): Promise<void> {
  state.isSaving = true;

  await oops(
    async () => {
      const tank = await client.tanks.createTank(dto, username.value);
      location.assign(`/profile/${username.value}/tanks/${tank.id}`);
    },
    {
      [405]: () => {
        toasts.toast({
          id: 'tank-limit-reached',
          message:
            'Uh oh! It seems you have reached your limit for custom tank profiles. (Each user is limited to 10 custom tank profiles.) You can either edit an existing profile, or delete one and then create a new profile.',
          type: ToastType.Error,
        });
      },
    },
  );

  state.isSaving = false;
}
</script>
