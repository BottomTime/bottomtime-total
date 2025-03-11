<template>
  <PageTitle title="Manage Agencies" />
  <BreadCrumbs :items="BreadcrumbItems" />

  <DrawerPanel
    :visible="state.showEditAgency"
    :title="`Edit ${state.selectedAgency?.name || 'Agency'}`"
    @close="onCancelEditAgency"
  >
    <EditAgency
      :agency="state.selectedAgency"
      :is-saving="state.isSaving"
      @save="onSaveAgency"
      @cancel="onCancelEditAgency"
    />
  </DrawerPanel>

  <ConfirmDialog
    :visible="state.showConfirmDelete"
    @confirm="onConfirmDeleteAgency"
    @cancel="onCancelDeleteAgency"
  >
    <p>
      <span>Are you sure you want to delete "</span>
      <span class="font-bold">{{ state.selectedAgency?.name }}</span>
      <span>"?</span>
    </p>

    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <RequireAuth2 :authorizer="isAuthorized">
    <FormBox class="sticky top-16 flex justify-between items-baseline">
      <p>
        <span>Showing </span>
        <span class="font-bold">{{ state.agencies.data.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ state.agencies.totalCount }}</span>
        <span> agencies.</span>
      </p>

      <div>
        <FormButton type="primary" class="space-x-1" @click="onCreateAgency">
          <span><i class="fa-solid fa-plus"></i></span>
          <span>Add Agency</span>
        </FormButton>
      </div>
    </FormBox>

    <div v-if="state.isLoading" class="text-center text-xl my-4">
      <LoadingSpinner message="Fetching agencies..." />
    </div>

    <TransitionList v-else class="mx-2">
      <li v-if="state.agencies.data.length === 0">
        <p class="text-center my-4 text-lg">
          <span>No agencies have been created yet. Try </span>
          <a @click="onCreateAgency">creating one</a>
          <span>.</span>
        </p>
      </li>

      <AgenciesListItem
        v-for="agency in state.agencies.data"
        :key="agency.id"
        :agency="agency"
        @edit="onEditAgency"
        @delete="onDeleteAgency"
      />
    </TransitionList>
  </RequireAuth2>
</template>

<script lang="ts" setup>
import { AgencyDTO, ApiList, UserDTO, UserRole } from '@bottomtime/api';

import { onMounted, reactive, watch } from 'vue';

import { useClient } from '../../api-client';
import { Breadcrumb } from '../../common';
import AgenciesListItem from '../../components/admin/agencies-list-item.vue';
import EditAgency from '../../components/admin/edit-agency.vue';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import DrawerPanel from '../../components/common/drawer-panel.vue';
import FormBox from '../../components/common/form-box.vue';
import FormButton from '../../components/common/form-button.vue';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth2 from '../../components/common/require-auth2.vue';
import TransitionList from '../../components/common/transition-list.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';

interface AgenciesViewState {
  agencies: ApiList<AgencyDTO>;
  isDeleting: boolean;
  isLoading: boolean;
  isSaving: boolean;
  selectedAgency?: AgencyDTO;
  showConfirmDelete: boolean;
  showEditAgency: boolean;
}

const BreadcrumbItems: Breadcrumb[] = [
  {
    label: 'Admin',
    to: '/admin',
  },
  {
    label: 'Agencies',
    active: true,
  },
] as const;

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const toasts = useToasts();

const state = reactive<AgenciesViewState>({
  agencies: {
    data: [],
    totalCount: 0,
  },
  isDeleting: false,
  isLoading: true,
  isSaving: false,
  showConfirmDelete: false,
  showEditAgency: false,
});

function isAuthorized(user: UserDTO | null): boolean {
  return user?.role === UserRole.Admin;
}

function onCreateAgency() {
  state.selectedAgency = undefined;
  state.showEditAgency = true;
}

function onEditAgency(agency: AgencyDTO) {
  state.selectedAgency = agency;
  state.showEditAgency = true;
}

function onCancelEditAgency() {
  state.showEditAgency = false;
  state.selectedAgency = undefined;
}

function onDeleteAgency(agency: AgencyDTO) {
  state.selectedAgency = agency;
  state.showConfirmDelete = true;
}

function onCancelDeleteAgency() {
  state.showConfirmDelete = false;
  state.selectedAgency = undefined;
}

async function onConfirmDeleteAgency(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    if (!state.selectedAgency) return;
    // await client.certifications.deleteAgency(state.selectedAgency.id);

    const index = state.agencies.data.findIndex(
      (a) => a.id === state.selectedAgency?.id,
    );
    if (index > -1) {
      state.agencies.data.splice(index, 1);
      state.agencies.totalCount--;
    }

    toasts.success('agency-deleted', 'Agency has been deleted successfully.');

    state.showConfirmDelete = false;
    state.selectedAgency = undefined;
  });

  state.isDeleting = false;
}

async function onSaveAgency(agency: AgencyDTO): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    // if (agency.id) {
    //   const saved = await client.certifications.updateAgency(agency.id, agency);

    //   const index = state.agencies.data.findIndex((a) => a.id === saved.id);
    //   if (index > -1) {
    //     state.agencies.data.splice(index, 1, saved);
    //   }
    // } else {
    //   const created = await client.certifications.createAgency(agency);
    //   state.agencies.data.splice(0, 0, created);
    //   state.agencies.totalCount++;
    // }

    toasts.success('agency-saved', 'Agency has been saved successfully.');

    state.showEditAgency = false;
    state.selectedAgency = undefined;
  });

  state.isSaving = false;
}

async function refreshList(): Promise<void> {
  state.isLoading = true;

  await oops(async () => {
    state.agencies = await client.certifications.listAgencies();
  });

  state.isLoading = false;
}

onMounted(refreshList);
watch(
  () => currentUser.user,
  async (user) => {
    if (isAuthorized(user)) await refreshList();
  },
);
</script>
