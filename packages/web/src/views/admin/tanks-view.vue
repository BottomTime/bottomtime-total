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
    icon="fa-solid fa-trash-can fa-2x"
    dangerous
    @cancel="onCancelDelete"
    @confirm="onConfirmDelete"
  >
    <p>
      <span>Are you sure you want to delete tank profile "</span>
      <span class="font-bold">{{ state.currentTank?.name }}</span>
      <span>"?</span>
    </p>

    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <PageTitle title="Manage Tank Profiles" />
  <RequireAuth :authorizer="isAuthorized">
    <BreadCrumbs :items="Breadcrumbs" />
    <TanksList
      :tanks="state.results"
      @add="onAddTank"
      @delete="onDeleteTank"
      @select="onSelectTank"
    />
  </RequireAuth>
</template>

<script setup lang="ts">
import { ApiList, TankDTO, TankMaterial, UserRole } from '@bottomtime/api';

import { computed, onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import { Breadcrumb, ToastType } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import DrawerPanel from '../../components/common/drawer-panel.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth2.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import EditTank from '../../components/tanks/edit-tank.vue';
import TanksList from '../../components/tanks/tanks-list.vue';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';

interface AdminTanksState {
  currentTank?: TankDTO;
  isDeleting: boolean;
  isLoading: boolean;
  isSaving: boolean;
  results: ApiList<TankDTO>;
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
const toasts = useToasts();
const currentUser = useCurrentUser();

const state = reactive<AdminTanksState>({
  isDeleting: false,
  isLoading: true,
  isSaving: false,
  results: {
    data: [],
    totalCount: 0,
  },
  showConfirmDelete: false,
  showTankEditor: false,
});

const isAuthorized = computed(() => currentUser.user?.role === UserRole.Admin);

onMounted(async () => {
  await oops(async () => {
    if (!isAuthorized.value) return;
    state.results = await client.tanks.listTanks();
  });
  state.isLoading = false;
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
    await client.tanks.deleteTank(state.currentTank.id);

    const index = state.results.data.findIndex(
      (t) => t.id === state.currentTank?.id,
    );
    if (index > -1) state.results.data.splice(index, 1);

    toasts.toast({
      id: 'tank-deleted',
      type: ToastType.Success,
      message: 'Tank profile deleted successfully',
    });
  });

  state.showConfirmDelete = false;
  state.isDeleting = false;
  state.currentTank = undefined;
}

function onCloseTankEditor() {
  state.showTankEditor = false;
}

async function onSaveTank(dto: TankDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    if (dto.id) {
      await client.tanks.updateTank(dto);

      const index = state.results.data.findIndex((t) => t.id === dto.id);
      if (index > -1) state.results.data.splice(index, 1, dto);

      toasts.toast({
        id: 'tank-saved',
        type: ToastType.Success,
        message: 'Tank profile saved successfully',
      });
    } else {
      const tank = await client.tanks.createTank(dto);
      state.results.data.splice(0, 0, tank);

      toasts.toast({
        id: 'tank-created',
        type: ToastType.Success,
        message: 'Tank profile created successfully',
      });
    }
  });

  state.currentTank = undefined;
  state.showTankEditor = false;
  state.isSaving = false;
}
</script>
