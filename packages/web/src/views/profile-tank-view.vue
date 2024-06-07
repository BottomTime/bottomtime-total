<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="breadcrumbs" />

  <ConfirmDialog
    :visible="state.showConfirmDelete"
    title="Delete Tank Profile?"
    confirm-text="Delete"
    dangerous
    :is-loading="state.isDeleting"
    @confirm="onConfirmDelete"
    @cancel="onCancelDelete"
  >
  </ConfirmDialog>

  <RequireAuth
    :auth-check="
      (currentUser) =>
        currentUser.role === UserRole.Admin ||
        currentUser.username.toLowerCase() === username.toLowerCase()
    "
  >
    <div v-if="state.tank">
      <EditTank
        :tank="state.tank"
        :is-saving="state.isSaving"
        show-delete
        @save="onSave"
        @delete="onDelete"
      />
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
import ConfirmDialog from '../components/dialog/confirm-dialog.vue';
import EditTank from '../components/tanks/edit-tank.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useToasts } from '../store';

interface ProfileTankViewState {
  isDeleting: boolean;
  isSaving: boolean;
  showConfirmDelete: boolean;
  tank?: TankDTO;
}

const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const client = useClient();
const initialState = useInitialState();
const location = useLocation();
const oops = useOops();
const route = useRoute();
const toasts = useToasts();

const username = computed(() => route.params.username as string);
const title = computed(() => state.tank?.name || 'Edit Tank Profile');
const breadcrumbs: Breadcrumb[] = [
  {
    label: 'Profile',
    to: `/profile/${username.value}`,
  },
  {
    label: 'Tank Profiles',
    to: `/profile/${username.value}/tanks`,
  },
  {
    label: title,
    active: true,
  },
];

const state = reactive<ProfileTankViewState>({
  isDeleting: false,
  isSaving: false,
  showConfirmDelete: false,
  tank: initialState?.currentTank,
});

onServerPrefetch(async () => {
  const tankId = route.params.tankId as string;

  await oops(
    async () => {
      const tank = await client.tanks.getTank(tankId, username.value);
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

async function onSave(dto: TankDTO) {
  state.isSaving = true;

  await oops(async () => {
    const tank = client.tanks.wrapDTO(dto, username.value);
    await tank.save();
    state.tank = dto;
    toasts.toast({
      id: 'tank-saved',
      message: 'Tank profile saved successfully',
      type: ToastType.Success,
    });
  });

  state.isSaving = false;
}

function onDelete() {
  state.showConfirmDelete = true;
}

async function onConfirmDelete(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    if (!state.tank) return;
    const tank = client.tanks.wrapDTO(state.tank, username.value);
    await tank.delete();
    location.assign(`/profile/${username.value}/tanks`);
  });

  state.isDeleting = false;
  state.showConfirmDelete = false;
}

function onCancelDelete() {
  state.showConfirmDelete = false;
}
</script>
