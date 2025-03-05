<template>
  <DrawerPanel
    :visible="state.showEditAssociation"
    title="Edit Association"
    @close="onCloseEditAssociation"
  >
    <EditProfessionalAssociation
      :agencies="state.agencies"
      :association="state.selectedAssociation"
      :is-saving="state.isSaving"
      @cancel="onCloseEditAssociation"
      @save="onSaveAssociation"
    />
  </DrawerPanel>

  <ConfirmDialog
    v-if="state.selectedAssociation"
    :visible="state.showConfirmDelete"
    title="Delete Association?"
    confirm-text="Delete"
    :is-loading="state.isDeleting"
    dangerous
    @confirm="onConfirmDeleteAssociation"
    @cancel="onCancelDeleteAssociation"
  >
    <p>
      <span>Are you sure you want to delete professional association "</span>
      <span class="font-bold">
        {{ state.selectedAssociation.agency.name }}
        {{ state.selectedAssociation.title }} #{{
          state.selectedAssociation.identificationNumber
        }}
      </span>
      <span>"?</span>
    </p>

    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <PageTitle title="Professional Associations" />
  <BreadCrumbs :items="BreadcrumbItems" />

  <RequireAuth2
    :authorizer="
      () =>
        route.params.username === currentUser.user?.username ||
        currentUser.user?.role === UserRole.Admin
    "
  >
    <div>
      <FormBox class="flex justify-between items-center">
        <p>
          <span>Showing </span>
          <span class="text-sm font-mono font-bold">
            {{ state.associations.data.length }}
          </span>
          <span> of </span>
          <span class="text-sm font-mono font-bold">
            {{ state.associations.totalCount }}
          </span>
          <span> professional associations.</span>
        </p>

        <div>
          <FormButton
            type="primary"
            control-id="add-association"
            test-id="add-association"
            @click="onAddAssociation"
          >
            <p class="space-x-1">
              <span>
                <i class="fa-solid fa-plus"></i>
              </span>
              <span>Add</span>
            </p>
          </FormButton>
        </div>
      </FormBox>

      <div v-if="state.isLoading" class="text-center text-lg my-4">
        <LoadingSpinner message="Fetching professional associations..." />
      </div>
      <TransitionList v-else class="mx-2">
        <li
          v-if="!state.associations.data.length"
          class="text-lg text-center my-4"
        >
          <p>
            You do not have any professional associations yet.
            <a @click="onAddAssociation">Add one now.</a>
          </p>
        </li>

        <ProfessionalAssociationListItem
          v-for="association in state.associations.data"
          :key="association.id"
          :association="association"
          @edit="onEditAssociation"
          @delete="onDeleteAssociation"
        />
      </TransitionList>
    </div>
  </RequireAuth2>
</template>

<script lang="ts" setup>
import {
  AgencyDTO,
  ApiList,
  ProfessionalAssociationDTO,
  UserRole,
} from '@bottomtime/api';

import { onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import DrawerPanel from '../../components/common/drawer-panel.vue';
import FormBox from '../../components/common/form-box.vue';
import FormButton from '../../components/common/form-button.vue';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth2 from '../../components/common/require-auth2.vue';
import TransitionList from '../../components/common/transition-list.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import EditProfessionalAssociation from '../../components/users/edit-professional-association.vue';
import ProfessionalAssociationListItem from '../../components/users/professional-association-list-item.vue';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';

interface ProfessionalAssociationViewState {
  agencies: AgencyDTO[];
  associations: ApiList<ProfessionalAssociationDTO>;
  isDeleting: boolean;
  isLoading: boolean;
  isSaving: boolean;
  selectedAssociation?: ProfessionalAssociationDTO;
  showConfirmDelete: boolean;
  showEditAssociation: boolean;
}

const BreadcrumbItems: Breadcrumb[] = [
  {
    label: 'Profile',
    to: '/profile',
  },
  {
    label: 'Professional Associations',
    active: true,
  },
] as const;

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();

const state = reactive<ProfessionalAssociationViewState>({
  agencies: [],
  associations: {
    data: [],
    totalCount: 0,
  },
  isDeleting: false,
  isLoading: true,
  isSaving: false,
  showConfirmDelete: false,
  showEditAssociation: false,
});

function onAddAssociation() {
  state.selectedAssociation = undefined;
  state.showEditAssociation = true;
}

function onEditAssociation(association: ProfessionalAssociationDTO) {
  state.selectedAssociation = association;
  state.showEditAssociation = true;
}

function onCloseEditAssociation() {
  state.showEditAssociation = false;
  state.selectedAssociation = undefined;
}

async function onSaveAssociation(
  association: ProfessionalAssociationDTO,
): Promise<void> {
  state.isSaving = true;

  await oops(async () => {
    let result: ProfessionalAssociationDTO;

    if (association.id) {
      result = await client.certifications.updateProfessionalAssociation(
        route.params.username as string,
        association.id,
        {
          ...association,
          agency: association.agency.id,
        },
      );

      const index = state.associations.data.findIndex(
        (a) => a.id === result.id,
      );
      if (index > -1) {
        state.associations.data.splice(index, 1, result);
      }
    } else {
      result = await client.certifications.createProfessionalAssociation(
        route.params.username as string,
        {
          ...association,
          agency: association.agency.id,
        },
      );
      state.associations.data.splice(0, 0, result);
      state.associations.totalCount++;
    }

    state.showEditAssociation = false;
  });

  state.isSaving = false;
}

function onDeleteAssociation(association: ProfessionalAssociationDTO) {
  state.selectedAssociation = association;
  state.showConfirmDelete = true;
}

function onCancelDeleteAssociation() {
  state.showConfirmDelete = false;
  state.selectedAssociation = undefined;
}

async function onConfirmDeleteAssociation(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    await client.certifications.deleteProfessionalAssociation(
      route.params.username as string,
      state.selectedAssociation!.id,
    );

    const index = state.associations.data.findIndex(
      (a) => a.id === state.selectedAssociation!.id,
    );
    if (index > -1) {
      state.associations.data.splice(index, 1);
      state.associations.totalCount--;
    }

    state.showConfirmDelete = false;
    state.selectedAssociation = undefined;
  });

  state.isDeleting = false;
}

onMounted(async () => {
  await oops(async () => {
    state.associations =
      await client.certifications.listProfessionalAssociations(
        route.params.username as string,
      );
    const agencies = await client.certifications.listAgencies();
    state.agencies = agencies.data;
  });
  state.isLoading = false;
});
</script>
