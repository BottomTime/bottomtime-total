<template>
  <PageTitle :title="title" />
  <RequireAuth :role="UserRole.Admin">
    <BreadCrumbs :items="Breadcrumbs" />

    <div v-if="tanks.currentTank">
      <EditTank
        :tank="tanks.currentTank"
        :is-saving="state.isSaving"
        @save="onSave"
      />
    </div>

    <NotFound v-else />
  </RequireAuth>
</template>

<script lang="ts" setup>
import { TankDTO, UserRole } from '@bottomtime/api';

import { computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb, ToastType } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth.vue';
import EditTank from '../../components/tanks/edit-tank.vue';
import { useOops } from '../../oops';
import { useTanks, useToasts } from '../../store';

interface AdminTankViewState {
  isSaving: boolean;
}

const client = useClient();
const oops = useOops();
const route = useRoute();
const tanks = useTanks();
const toasts = useToasts();

const state = reactive<AdminTankViewState>({
  isSaving: false,
});

const title = computed(() => tanks.currentTank?.name || 'Edit Tank Profile');
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
      if (typeof route.params.tankId !== 'string') return;

      const tank = await client.tanks.getTank(route.params.tankId);
      tanks.currentTank = tank.toJSON();
    },
    {
      [404]: () => {
        tanks.currentTank = null;
      },
    },
  );
});

async function onSave(dto: TankDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    const tank = client.tanks.wrapDTO(dto);
    await tank.save();
    tanks.currentTank = dto;

    toasts.toast({
      id: 'tank-saved',
      type: ToastType.Success,
      message: 'Tank profile saved successfully',
    });
  });

  state.isSaving = false;
}
</script>
