<template>
  <DrawerPanel
    :title="tanks.currentTank?.id ? 'Edit Tank Profile' : 'Create New Tank'"
    :full-screen="
      tanks.currentTank?.id
        ? `/admin/tanks/${tanks.currentTank.id}`
        : '/admin/tanks/new'
    "
    :visible="state.showTankEditor && !!tanks.currentTank"
    @close="onCloseTankEditor"
  >
    <EditTank
      v-if="tanks.currentTank"
      :tank="tanks.currentTank"
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
          <span class="font-bold">{{ tanks.currentTank?.name }}</span>
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
      :tanks="tanks.results"
      @add="onAddTank"
      @delete="onDeleteTank"
      @select="onSelectTank"
    />
  </RequireAuth>
</template>

<script setup lang="ts">
import { TankDTO, TankMaterial, UserRole } from '@bottomtime/api';

import { onServerPrefetch, reactive } from 'vue';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import DrawerPanel from '../components/common/drawer-panel.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import ConfirmDialog from '../components/dialog/confirm-dialog.vue';
import EditTank from '../components/tanks/edit-tank.vue';
import TanksList from '../components/tanks/tanks-list.vue';
import { useOops } from '../oops';
import { useTanks, useToasts } from '../store';

interface AdminTanksState {
  isDeleting: boolean;
  isLoading: boolean;
  isSaving: boolean;
  showConfirmDelete: boolean;
  showTankEditor: boolean;
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
const oops = useOops();
const tanks = useTanks();
const toasts = useToasts();

const state = reactive<AdminTanksState>({
  isDeleting: false,
  isLoading: false,
  isSaving: false,
  showConfirmDelete: false,
  showTankEditor: false,
});

onServerPrefetch(async () => {
  await oops(async () => {
    const results = await client.tanks.listTanks();
    tanks.results.tanks = results.tanks.map((tank) => tank.toJSON());
    tanks.results.totalCount = results.totalCount;
  });
});

function onAddTank() {
  tanks.currentTank = {
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
  tanks.currentTank = tank;
  state.showTankEditor = true;
}

function onDeleteTank(tank: TankDTO) {
  tanks.currentTank = tank;
  state.showConfirmDelete = true;
}

function onCancelDelete() {
  state.showConfirmDelete = false;
}

async function onConfirmDelete(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    if (!tanks.currentTank) return;
    const tank = client.tanks.wrapDTO(tanks.currentTank);
    await tank.delete();

    const index = tanks.results.tanks.findIndex((t) => t.id === tank.id);
    if (index > -1) tanks.results.tanks.splice(index, 1);

    toasts.toast({
      id: 'tank-deleted',
      type: ToastType.Success,
      message: 'Tank profile deleted successfully',
    });
  });

  state.showConfirmDelete = false;
  state.isDeleting = false;
  tanks.currentTank = null;
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

      const index = tanks.results.tanks.findIndex((t) => t.id === tank.id);
      if (index > -1) tanks.results.tanks.splice(index, 1, tank.toJSON());

      toasts.toast({
        id: 'tank-saved',
        type: ToastType.Success,
        message: 'Tank profile saved successfully',
      });
    } else {
      const tank = await client.tanks.createTank(dto);
      tanks.results.tanks.splice(0, 0, tank.toJSON());

      toasts.toast({
        id: 'tank-created',
        type: ToastType.Success,
        message: 'Tank profile created successfully',
      });
    }
  });

  tanks.currentTank = null;
  state.showTankEditor = false;
  state.isSaving = false;
}
</script>
