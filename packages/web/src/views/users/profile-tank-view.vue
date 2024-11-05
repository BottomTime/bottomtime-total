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

  <RequireAuth :authorizer="authorizer">
    <div v-if="state.isLoading" class="flex justify-center text-xl my-8">
      <LoadingSpinner message="Fetching tank profile..." />
    </div>

    <div v-else-if="state.currentTank">
      <EditTank
        :tank="state.currentTank"
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
import {
  CreateOrUpdateTankParamsSchema,
  TankDTO,
  TankMaterial,
  UserDTO,
  UserRole,
} from '@bottomtime/api';

import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb, ToastType } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth2.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import EditTank from '../../components/tanks/edit-tank.vue';
import { useOops } from '../../oops';
import { useToasts } from '../../store';

interface ProfileTankViewState {
  currentTank?: TankDTO;
  isDeleting: boolean;
  isLoading: boolean;
  isSaving: boolean;
  showConfirmDelete: boolean;
}

const client = useClient();
const oops = useOops();
const route = useRoute();
const router = useRouter();
const toasts = useToasts();

const state = reactive<ProfileTankViewState>({
  isDeleting: false,
  isLoading: true,
  isSaving: false,
  showConfirmDelete: false,
});

const username = computed(() => route.params.username as string);
const tankId = computed(() =>
  typeof route.params.tankId === 'string' ? route.params.tankId : null,
);
const title = computed(() => state.currentTank?.name || 'Edit Tank Profile');
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

function authorizer(user?: UserDTO): boolean {
  if (typeof route.params.username !== 'string') return false;
  if (!user) return false;
  if (user.role === UserRole.Admin) return true;
  return route.params.username.toLowerCase() === user.username.toLowerCase();
}

onMounted(async () => {
  await oops(
    async () => {
      if (tankId.value) {
        const tank = await client.tanks.getTank(tankId.value, username.value);
        state.currentTank = tank.toJSON();
      } else {
        state.currentTank = {
          id: '',
          isSystem: false,
          material: TankMaterial.Aluminum,
          name: '',
          volume: 0,
          workingPressure: 0,
        };
      }
    },
    {
      [404]: () => {
        state.currentTank = undefined;
      },
    },
  );

  state.isLoading = false;
});

async function onSave(dto: TankDTO) {
  state.isSaving = true;

  await oops(async () => {
    if (dto.id) {
      const tank = client.tanks.wrapDTO(dto, username.value);
      await tank.save();
      state.currentTank = dto;
    } else {
      const newTank = await client.tanks.createTank(
        CreateOrUpdateTankParamsSchema.parse(dto),
        username.value,
      );
      state.currentTank = newTank.toJSON();
      await router.push(`/profile/${username.value}/tanks/${newTank.id}`);
    }

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
    if (!state.currentTank) return;
    const tank = client.tanks.wrapDTO(state.currentTank, username.value);
    await tank.delete();
    await router.push(`/profile/${username.value}/tanks`);
  });

  state.isDeleting = false;
  state.showConfirmDelete = false;
}

function onCancelDelete() {
  state.showConfirmDelete = false;
}
</script>
