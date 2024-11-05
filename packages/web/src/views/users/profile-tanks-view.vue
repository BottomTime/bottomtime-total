<template>
  <DrawerPanel
    :title="state.currentTank?.id ? 'Edit Tank Profile' : 'Add Tank Profile'"
    :visible="state.showEditTank && !!state.currentTank"
    :full-screen="
      state.currentTank?.id
        ? `/profile/${username}/tanks/${state.currentTank.id}`
        : `/profile/${username}/tanks/new`
    "
    @close="oncloseEditTank"
  >
    <EditTank
      v-if="state.currentTank"
      :tank="state.currentTank"
      :responsive="false"
      :is-saving="state.isSaving"
      :show-delete="!!state.currentTank?.id"
      @save="onSaveTank"
      @delete="onDeleteTank"
    />
  </DrawerPanel>

  <ConfirmDialog
    :visible="state.showConfirmDelete"
    :is-loading="state.isDeleting"
    size="md"
    title="Delete Tank?"
    icon="fa-solid fa-trash-can fa-2x"
    confirm-text="Delete"
    dangerous
    @cancel="onCancelDeleteTank"
    @confirm="onConfirmDeleteTank"
  >
    <p>
      <span>Are you sure you want to delete tank profile "</span>
      <span class="font-bold">{{ state.currentTank?.name }}</span>
      <span>"?</span>
    </p>

    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <PageTitle title="Manage Tank Profiles" />
  <RequireAuth
    :auth-check="
      (currentUser) =>
        currentUser.role === UserRole.Admin ||
        currentUser.username.toLowerCase() === username.toLowerCase()
    "
  >
    <div v-if="state.isLoading" class="flex justify-center text-xl my-8">
      <LoadingSpinner message="Fetching tank profiles..." />
    </div>

    <div v-else-if="state.tanks">
      <BreadCrumbs :items="Breadcrumbs" />
      <TanksList
        :tanks="state.tanks"
        :show-add-tank="(state.tanks.totalCount || 0) < 10"
        @add="onAddTank"
        @select="onSelectTank"
        @delete="onDeleteTank"
      />
    </div>

    <NotFound v-else />
  </RequireAuth>
</template>

<script lang="ts" setup>
import {
  ListTanksResponseDTO,
  TankDTO,
  TankMaterial,
  UserRole,
} from '@bottomtime/api';

import LoadingSpinner from '@/components/common/loading-spinner.vue';

import { computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb, ToastType } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import DrawerPanel from '../../components/common/drawer-panel.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import EditTank from '../../components/tanks/edit-tank.vue';
import TanksList from '../../components/tanks/tanks-list.vue';
import { useOops } from '../../oops';
import { useToasts } from '../../store';

interface ProfileTanksViewState {
  currentTank?: TankDTO;
  isDeleting: boolean;
  isLoading: boolean;
  isSaving: boolean;
  showConfirmDelete: boolean;
  showEditTank: boolean;
  tanks?: ListTanksResponseDTO;
}

const client = useClient();
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
  isLoading: true,
  isSaving: false,
  showConfirmDelete: false,
  showEditTank: false,
});

const username = computed(() => route.params.username as string);

onMounted(async () => {
  await oops(
    async () => {
      const result = await client.tanks.listTanks({
        username: username.value,
        includeSystem: false,
      });

      state.tanks = {
        tanks: result.tanks.map((tank) => tank.toJSON()),
        totalCount: result.totalCount,
      };
    },
    {
      [404]: () => {
        // User profile not found!
        state.tanks = undefined;
      },
    },
  );

  state.isLoading = false;
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
}

async function onConfirmDeleteTank(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    if (!state.currentTank || !state.tanks) return;

    const tank = client.tanks.wrapDTO(state.currentTank, username.value);
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

  state.currentTank = undefined;
  state.isDeleting = false;
  state.showConfirmDelete = false;
  state.showEditTank = false;
}

async function onSaveTank(dto: TankDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    if (!state.tanks) return;

    if (dto.id) {
      const tank = client.tanks.wrapDTO(dto, username.value);
      await tank.save();

      const index = state.tanks.tanks.findIndex((t) => t.id === dto.id);
      if (index > -1) {
        state.tanks.tanks.splice(index, 1, dto);
      }

      toasts.toast({
        id: 'tank-saved',
        type: ToastType.Success,
        message: 'Tank profile saved',
      });
    } else {
      const tank = await client.tanks.createTank(dto, username.value);
      state.tanks.tanks.splice(0, 0, tank.toJSON());

      toasts.toast({
        id: 'tank-created',
        type: ToastType.Success,
        message: 'Tank profile has been created',
      });
    }
  });

  state.currentTank = undefined;
  state.isSaving = false;
  state.showEditTank = false;
}
</script>
