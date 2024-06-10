<template>
  <DrawerPanel
    :title="tanks.currentTank?.id ? 'Edit Tank Profile' : 'Add Tank Profile'"
    :visible="state.showEditTank && !!tanks.currentTank"
    :full-screen="
      tanks.currentTank?.id
        ? `/profile/${username}/tanks/${tanks.currentTank.id}`
        : `/profile/${username}/tanks/new`
    "
    @close="oncloseEditTank"
  >
    <EditTank
      v-if="tanks.currentTank"
      :tank="tanks.currentTank"
      :responsive="false"
      :is-saving="state.isSaving"
      :show-delete="!!tanks.currentTank?.id"
      @save="onSaveTank"
      @delete="onDeleteTank"
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
          <span class="font-bold">{{ tanks.currentTank?.name }}</span>
          <span>"?</span>
        </p>

        <p>This action cannot be undone.</p>
      </div>
    </div>
  </ConfirmDialog>

  <PageTitle title="Manage Tank Profiles" />
  <RequireAuth
    :auth-check="
      (currentUser) =>
        currentUser.role === UserRole.Admin ||
        currentUser.username.toLowerCase() === username.toLowerCase()
    "
  >
    <div v-if="tanks.results.totalCount > -1">
      <BreadCrumbs :items="Breadcrumbs" />
      <TanksList
        :tanks="tanks.results"
        :show-add-tank="(tanks.results.totalCount || 0) < 10"
        @add="onAddTank"
        @select="onSelectTank"
        @delete="onDeleteTank"
      />
    </div>

    <NotFound v-else />
  </RequireAuth>
</template>

<script lang="ts" setup>
import { TankDTO, TankMaterial, UserRole } from '@bottomtime/api';

import { computed, onServerPrefetch, reactive } from 'vue';
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
import { useOops } from '../oops';
import { useTanks, useToasts } from '../store';

interface ProfileTanksViewState {
  isDeleting: boolean;
  isSaving: boolean;
  showConfirmDelete: boolean;
  showEditTank: boolean;
}

const client = useClient();
const oops = useOops();
const tanks = useTanks();
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
});

const username = computed(() => route.params.username as string);

onServerPrefetch(async () => {
  await oops(
    async () => {
      const result = await client.tanks.listTanks({
        username: username.value,
        includeSystem: false,
      });

      tanks.results.tanks = result.tanks.map((tank) => tank.toJSON());
      tanks.results.totalCount = result.totalCount;
    },
    {
      [404]: () => {
        // User profile not found!
        tanks.results.totalCount = -1;
      },
    },
  );
});

function oncloseEditTank() {
  state.showEditTank = false;
}

function onAddTank() {
  tanks.currentTank = {
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
  tanks.currentTank = tank;
  state.showEditTank = true;
}

function onDeleteTank(tank: TankDTO) {
  tanks.currentTank = tank;
  state.showConfirmDelete = true;
}

function onCancelDeleteTank() {
  state.showConfirmDelete = false;
}

async function onConfirmDeleteTank(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    if (!tanks.currentTank) return;

    const tank = client.tanks.wrapDTO(tanks.currentTank, username.value);
    await tank.delete();

    const index = tanks.results.tanks.findIndex(
      (t) => t.id === tanks.currentTank?.id,
    );
    if (index > -1) {
      tanks.results.tanks.splice(index, 1);
    }

    toasts.toast({
      id: 'tank-deleted',
      type: ToastType.Success,
      message: 'Tank profile deleted',
    });
  });

  tanks.currentTank = null;
  state.isDeleting = false;
  state.showConfirmDelete = false;
  state.showEditTank = false;
}

async function onSaveTank(dto: TankDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    if (dto.id) {
      const tank = client.tanks.wrapDTO(dto, username.value);
      await tank.save();

      const index = tanks.results.tanks.findIndex((t) => t.id === dto.id);
      if (index > -1) {
        tanks.results.tanks.splice(index, 1, dto);
      }

      toasts.toast({
        id: 'tank-saved',
        type: ToastType.Success,
        message: 'Tank profile saved',
      });
    } else {
      const tank = await client.tanks.createTank(dto, username.value);
      tanks.results.tanks.splice(0, 0, tank.toJSON());

      toasts.toast({
        id: 'tank-created',
        type: ToastType.Success,
        message: 'Tank profile has been created',
      });
    }
  });

  tanks.currentTank = null;
  state.isSaving = false;
  state.showEditTank = false;
}
</script>
