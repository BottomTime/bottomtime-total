<template>
  <PageTitle :title="title" />
  <RequireAuth :role="UserRole.Admin">
    <BreadCrumbs :items="Breadcrumbs" />

    <div v-if="state.tank">
      <EditTank :tank="state.tank" :is-saving="state.isSaving" @save="onSave" />
    </div>

    <NotFound v-else />
  </RequireAuth>
</template>

<script lang="ts" setup>
import { TankDTO, UserRole } from '@bottomtime/api';

import { computed, onServerPrefetch, reactive, useSSRContext } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import EditTank from '../components/tanks/edit-tank.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useToasts } from '../store';

interface AdminTankViewState {
  isSaving: boolean;
  tank?: TankDTO;
}

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const initialState = useInitialState();
const oops = useOops();
const route = useRoute();
const toasts = useToasts();

const state = reactive<AdminTankViewState>({
  isSaving: false,
  tank: initialState?.currentTank,
});

const title = computed(() => state.tank?.name || 'Edit Tank Profile');
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

onServerPrefetch(async () => {
  await oops(
    async () => {
      if (typeof route.params.tankId !== 'string') return;

      const tank = await client.tanks.getTank(route.params.tankId);
      state.tank = tank.toJSON();
    },
    {
      [404]: () => {
        state.tank = undefined;
      },
    },
  );

  if (ctx) {
    ctx.currentTank = state.tank;
  }
});

async function onSave(dto: TankDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    const tank = client.tanks.wrapDTO(dto);
    await tank.save();
    state.tank = dto;

    toasts.toast({
      id: 'tank-saved',
      type: ToastType.Success,
      message: 'Tank profile saved successfully',
    });
  });

  state.isSaving = false;
}
</script>
