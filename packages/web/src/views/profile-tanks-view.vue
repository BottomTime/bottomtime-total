<template>
  <DrawerPanel
    title="Add Tank Profile"
    :visible="state.showEditTank && !!state.currentTank"
    :full-screen="
      state.currentTank?.id
        ? `/profile/${route.params.username}/tanks/${state.currentTank.id}`
        : `/profile/${route.params.username}/tanks/new`
    "
    @close="oncloseEditTank"
  >
    <EditTank
      v-if="state.currentTank"
      :tank="state.currentTank"
      :responsive="false"
      :is-saving="state.isSaving"
      @save="onSaveTank"
    />
  </DrawerPanel>

  <ConfirmDialog
    :visible="state.showConfirmDelete"
    :is-loading="state.isDeleting"
    size="md"
    title="Delete Tank?"
    confirm-text="Delete"
    dangerous
    @cancel="onCancelDeleteTank"
    @confirm="onConfirmDeleteTank"
  >
    <div class="flex gap-3">
      <p class="text-danger mt-2">
        <i class="fa-solid fa-trash-can fa-2x"></i>
      </p>

      <div class="space-y-2">
        <p>
          <span>Are you sure you want to delete tank profile "</span>
          <span class="font-bold">{{ state.currentTank?.name }}</span>
          <span>"?</span>
        </p>

        <p>This action cannot be undone.</p>
      </div>
    </div>
  </ConfirmDialog>

  <PageTitle title="Manage Tank Profiles" />
  <RequireAuth>
    <div v-if="state.tanks">
      <BreadCrumbs :items="Breadcrumbs" />
      <TanksList
        :tanks="state.tanks"
        @add="onAddTank"
        @select="onSelectTank"
        @delete="onDeleteTank"
      />
    </div>

    <NotFound v-else />
  </RequireAuth>
</template>

<script lang="ts" setup>
import { ListTanksResponseDTO, TankDTO, TankMaterial } from '@bottomtime/api';

import { onServerPrefetch, reactive, useSSRContext } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import DrawerPanel from '../components/common/drawer-panel.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import ConfirmDialog from '../components/dialog/confirm-dialog.vue';
import EditTank from '../components/tanks/edit-tank.vue';
import TanksList from '../components/tanks/tanks-list.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useToasts } from '../store';

interface ProfileTanksViewState {
  currentTank?: TankDTO;
  isDeleting: boolean;
  isSaving: boolean;
  showConfirmDelete: boolean;
  showEditTank: boolean;
  tanks?: ListTanksResponseDTO;
}

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : undefined;
const initialState = useInitialState();
const oops = useOops();
const toasts = useToasts();
const route = useRoute();

const Breadcrumbs: Breadcrumb[] = [
  {
    label: 'Profile',
    to: `/profile/${route.params.username}`,
  },
  {
    label: 'Tank Profiles',
    active: true,
  },
];

const state = reactive<ProfileTanksViewState>({
  isDeleting: false,
  isSaving: false,
  showConfirmDelete: false,
  showEditTank: false,
  tanks: initialState?.tanks,
});

onServerPrefetch(async () => {
  await oops(async () => {
    const username = route.params.username;
    if (typeof username !== 'string') return;

    const result = await client.tanks.listTanks({
      username,
      includeSystem: false,
    });

    state.tanks = {
      tanks: result.tanks.map((tank) => tank.toJSON()),
      totalCount: result.totalCount,
    };
  });

  if (ctx) ctx.tanks = state.tanks;
});

function oncloseEditTank() {
  state.showEditTank = false;
}

function onAddTank() {
  state.currentTank = {
    id: '',
    name: '',
    isSystem: false,
    material: TankMaterial.Aluminum,
    volume: 0,
    workingPressure: 0,
  };
  state.showEditTank = true;
}

function onSelectTank(tank: TankDTO) {
  state.currentTank = tank;
  state.showEditTank = true;
}

function onDeleteTank(tank: TankDTO) {
  state.currentTank = tank;
  state.showConfirmDelete = true;
}

function onCancelDeleteTank() {
  state.showConfirmDelete = false;
  state.currentTank = undefined;
}

async function onConfirmDeleteTank(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    const username = route.params.username;
    if (!state.currentTank || !state.tanks || typeof username !== 'string')
      return;

    const tank = client.tanks.wrapDTO(state.currentTank, username);
    await tank.delete();

    const index = state.tanks.tanks.findIndex(
      (t) => t.id === state.currentTank?.id,
    );
    if (index > -1) {
      state.tanks.tanks.splice(index, 1);
    }

    toasts.toast({
      id: 'tank-deleted',
      type: ToastType.Success,
      message: 'Tank profile deleted',
    });
  });

  state.isDeleting = false;
  state.currentTank = undefined;
  state.showConfirmDelete = false;
}

async function onSaveTank(dto: TankDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    const username = route.params.username;
    if (!state.tanks || typeof username !== 'string') return;

    if (dto.id) {
      const tank = client.tanks.wrapDTO(dto, username);
      await tank.save();

      const index = state.tanks.tanks.findIndex((t) => t.id === dto.id);
      if (index > -1) {
        state.tanks.tanks.splice(index, 1, dto);
      }
    } else {
      const tank = await client.tanks.createTank(dto, username);
      state.tanks.tanks.splice(0, 0, tank.toJSON());
    }

    toasts.toast({
      id: 'tank-saved',
      type: ToastType.Success,
      message: 'Tank profile saved',
    });
  });

  state.isSaving = false;
  state.currentTank = undefined;
  state.showEditTank = false;
}
</script>
