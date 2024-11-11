<template>
  <PageTitle :title="title" />
  <RequireAuth :authorizer="isAuthorized">
    <BreadCrumbs :items="Breadcrumbs" />

    <div v-if="state.isLoading" calss="flex justify-center text-xl my-8">
      <LoadingSpinner message="Fetching tank profile..." />
    </div>

    <div v-else-if="state.currentTank">
      <EditTank
        :tank="state.currentTank"
        :is-saving="state.isSaving"
        @save="onSave"
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
import EditTank from '../../components/tanks/edit-tank.vue';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';

interface AdminTankViewState {
  currentTank?: TankDTO;
  isLoading: boolean;
  isSaving: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();
const router = useRouter();
const toasts = useToasts();

const state = reactive<AdminTankViewState>({
  currentTank: !route.params.tankId
    ? {
        id: '',
        isSystem: true,
        material: TankMaterial.Aluminum,
        name: '',
        volume: 0,
        workingPressure: 0,
      }
    : undefined,
  isLoading: !!route.params.tankId,
  isSaving: false,
});

const isAuthorized = computed(() => currentUser.user?.role === UserRole.Admin);
const tankId = computed(() =>
  typeof route.params.tankId === 'string' ? route.params.tankId : null,
);
const title = computed(() => {
  if (tankId.value) {
    return state.currentTank?.name || 'Edit Tank Profile';
  }

  return 'Create New Tank Profile';
});

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

onMounted(async () => {
  await oops(
    async () => {
      if (!isAuthorized.value || !tankId.value) return;

      const tank = await client.tanks.getTank(tankId.value);
      state.currentTank = tank.toJSON();
    },
    {
      [404]: () => {
        state.currentTank = undefined;
      },
    },
  );

  state.isLoading = false;
});

async function onSave(dto: TankDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    if (tankId.value) {
      const tank = client.tanks.wrapDTO(dto);
      await tank.save();
      state.currentTank = dto;
    } else {
      const tank = await client.tanks.createTank(
        CreateOrUpdateTankParamsSchema.parse(dto),
      );
      state.currentTank = tank.toJSON();
      await router.push(`/admin/tanks/${tank.id}`);
    }

    toasts.toast({
      id: 'tank-saved',
      type: ToastType.Success,
      message: 'Tank profile saved successfully',
    });
  });

  state.isSaving = false;
}
</script>
