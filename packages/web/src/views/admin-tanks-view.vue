<template>
  <DrawerPanel
    :title="state.currentTank?.id ? 'Edit Tank Profile' : 'Create New Tank'"
    :full-screen="
      state.currentTank?.id
        ? `/admin/tanks/${state.currentTank.id}`
        : '/admin/tanks/new'
    "
    :visible="state.showTankEditor && !!state.currentTank"
    @close="onCloseTankEditor"
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
    @cancel="onCancelDelete"
    @confirm="onConfirmDelete"
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
  <RequireAuth :role="UserRole.Admin">
    <BreadCrumbs :items="Breadcrumbs" />
    <TanksList
      :tanks="state.tanks"
      @add="onAddTank"
      @delete="onDeleteTank"
      @select="onSelectTank"
    />
  </RequireAuth>
</template>

<script setup lang="ts">
import {
  ListTanksResponseDTO,
  TankDTO,
  TankMaterial,
  UserRole,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, useSSRContext } from 'vue';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import DrawerPanel from '../components/common/drawer-panel.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import ConfirmDialog from '../components/dialog/confirm-dialog.vue';
import EditTank from '../components/tanks/edit-tank.vue';
import TanksList from '../components/tanks/tanks-list.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useToasts } from '../store';

interface AdminTanksState {
  currentTank: TankDTO | null;
  isDeleting: boolean;
  isLoading: boolean;
  isSaving: boolean;
  showConfirmDelete: boolean;
  showTankEditor: boolean;
  tanks: ListTanksResponseDTO;
}

const Breadcrumbs: Breadcrumb[] = [
  {
    label: 'Admin',
    to: '/admin',
  },
  {
    label: 'Manage Tank Profiles',
    active: true,
  },
];

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const initialState = useInitialState();
const oops = useOops();
const toasts = useToasts();

const state = reactive<AdminTanksState>({
  currentTank: null,
  isDeleting: false,
  isLoading: false,
  isSaving: false,
  showConfirmDelete: false,
  showTankEditor: false,
  tanks: initialState?.tanks ?? {
    tanks: [],
    totalCount: 0,
  },
});

onServerPrefetch(async () => {
  await oops(async () => {
    const results = await client.tanks.listTanks();
    state.tanks = {
      tanks: results.tanks.map((tank) => tank.toJSON()),
      totalCount: results.totalCount,
    };
  });

  if (ctx) {
    ctx.tanks = state.tanks;
  }
});

function onAddTank() {
  state.currentTank = {
    id: '',
    isSystem: true,
    material: TankMaterial.Aluminum,
    name: '',
    volume: 0,
    workingPressure: 0,
  };
  state.showTankEditor = true;
}

function onSelectTank(tank: TankDTO) {
  state.currentTank = tank;
  state.showTankEditor = true;
}

function onDeleteTank(tank: TankDTO) {
  state.currentTank = tank;
  state.showConfirmDelete = true;
}

function onCancelDelete() {
  state.showConfirmDelete = false;
}

async function onConfirmDelete(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    if (!state.currentTank) return;
    const tank = client.tanks.wrapDTO(state.currentTank);
    await tank.delete();

    const index = state.tanks.tanks.findIndex((t) => t.id === tank.id);
    if (index > -1) state.tanks.tanks.splice(index, 1);
  });

  state.showConfirmDelete = false;
  state.isDeleting = false;
  state.currentTank = null;
}

function onCloseTankEditor() {
  state.showTankEditor = false;
}

async function onSaveTank(dto: TankDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    if (dto.id) {
      const tank = client.tanks.wrapDTO(dto);
      await tank.save();

      const index = state.tanks.tanks.findIndex((t) => t.id === tank.id);
      if (index > -1) state.tanks.tanks.splice(index, 1, tank.toJSON());

      toasts.toast({
        id: 'tank-saved',
        type: ToastType.Success,
        message: 'Tank profile saved successfully',
      });
    } else {
      const tank = await client.tanks.createTank(dto);
      state.tanks.tanks.splice(0, 0, tank.toJSON());

      toasts.toast({
        id: 'tank-created',
        type: ToastType.Success,
        message: 'Tank profile created successfully',
      });
    }
  });

  state.currentTank = null;
  state.showTankEditor = false;
  state.isSaving = false;
}
</script>
