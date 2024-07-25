<template>
  <DrawerPanel
    :visible="state.showEditFeature && !!state.selectedFeature"
    :title="
      state.isNew ? 'Create New Flag' : `Edit '${state.selectedFeature?.name}'`
    "
    :show-close="!state.isSaving"
    @close="state.showEditFeature = false"
  >
    <EditFeature
      v-if="state.selectedFeature"
      :feature="state.selectedFeature"
      :is-new="state.isNew"
      :is-saving="state.isSaving"
      :responsive="false"
      @save="onSaveFeature"
    />
  </DrawerPanel>

  <ConfirmDialog
    title="Delete feature flag?"
    confirm-text="Delete"
    :is-loading="state.isDeleting"
    :visible="state.showDeleteFeature"
    dangerous
    @confirm="onConfirmDelete"
    @cancel="onCancelDelete"
  >
    <div class="flex space-x-4">
      <div>
        <i class="fa-regular fa-circle-question fa-2x"></i>
      </div>

      <div class="flex flex-col space-y-2">
        <p>
          <span>Are you sure you want to permanently delete </span>
          <span class="font-bold">
            {{ state.selectedFeature?.name }}
          </span>
          <span>?</span>
        </p>

        <p>This action cannot be undone.</p>
      </div>
    </div>
  </ConfirmDialog>

  <PageTitle title="Feature Flags" />
  <BreadCrumbs :items="Breadcrumbs" />

  <FeaturesList
    :features="features.features"
    :toggling-key="state.togglingKey"
    @create="onCreateFeature"
    @delete="onDeleteFeature"
    @edit="onEditFeature"
    @toggle="onToggleFeature"
  />
</template>

<script lang="ts" setup>
import { FeatureDTO } from '@bottomtime/api';

import { reactive } from 'vue';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import EditFeature from '../components/admin/edit-feature.vue';
import FeaturesList from '../components/admin/features-list.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import DrawerPanel from '../components/common/drawer-panel.vue';
import PageTitle from '../components/common/page-title.vue';
import ConfirmDialog from '../components/dialog/confirm-dialog.vue';
import { useOops } from '../oops';
import { useFeatures, useToasts } from '../store';

interface AdminFeaturesState {
  isDeleting: boolean;
  isNew: boolean;
  isSaving: boolean;
  selectedFeature?: FeatureDTO;
  showDeleteFeature: boolean;
  showEditFeature: boolean;
  togglingKey?: string;
}

const Breadcrumbs: Breadcrumb[] = [
  {
    label: 'Admin',
    to: '/admin',
  },
  {
    label: 'Feature Flags',
    active: true,
  },
];

const client = useClient();
const features = useFeatures();
const oops = useOops();
const toasts = useToasts();

const state = reactive<AdminFeaturesState>({
  isDeleting: false,
  isNew: false,
  isSaving: false,
  showDeleteFeature: false,
  showEditFeature: false,
});

function onCreateFeature() {
  const epoch = new Date(0);
  state.isNew = true;
  state.selectedFeature = {
    createdAt: epoch,
    updatedAt: epoch,
    key: '',
    name: '',
    description: '',
    enabled: false,
  };
  state.showEditFeature = true;
}

async function createNewFeature(dto: FeatureDTO): Promise<void> {
  const newFeature = await client.features.createFeature(dto.key, {
    name: dto.name,
    description: dto.description,
    enabled: dto.enabled,
  });
  features.features.splice(0, 0, newFeature.toJSON());
  toasts.toast({
    id: 'feature-saved',
    message: 'Feature flag created successfully',
    type: ToastType.Success,
  });
}

async function updateExistingFeature(dto: FeatureDTO): Promise<void> {
  await oops(async () => {
    const feature = client.features.wrapDTO(dto);
    await feature.save();

    const index = features.features.findIndex((f) => f.key === dto.key);
    if (index > -1) {
      features.features[index].name = feature.name;
      features.features[index].description = feature.description;
      features.features[index].enabled = feature.enabled;
    }

    toasts.toast({
      id: 'feature-saved',
      message: 'Feature flag updated successfully',
      type: ToastType.Success,
    });
  });
}

async function onSaveFeature(
  feature: FeatureDTO,
  isNew: boolean,
): Promise<void> {
  state.isSaving = true;

  await oops(
    async () => {
      await (isNew
        ? createNewFeature(feature)
        : updateExistingFeature(feature));

      state.showEditFeature = false;
      state.selectedFeature = undefined;
    },
    {
      [409]: () => {
        toasts.toast({
          id: 'feature-key-conflict',
          message: 'Feature flag key already exists',
          type: ToastType.Error,
        });
      },
    },
  );

  state.isSaving = false;
}

async function onToggleFeature(dto: FeatureDTO): Promise<void> {
  state.togglingKey = dto.key;

  await oops(async () => {
    const feature = client.features.wrapDTO(dto);
    await feature.toggle();

    toasts.toast({
      id: feature.enabled ? 'feature-eneabled' : 'feature-disabled',
      message: `Feature flag ${
        feature.enabled ? 'enabled' : 'disabled'
      } successfully`,
      type: ToastType.Success,
    });

    const index = features.features.findIndex((f) => f.key === dto.key);
    if (index > -1) {
      features.features[index].enabled = feature.enabled;
    }
  });

  state.togglingKey = undefined;
}

function onEditFeature(dto: FeatureDTO): void {
  state.isNew = false;
  state.selectedFeature = dto;
  state.showEditFeature = true;
}

function onDeleteFeature(key: string): void {
  const index = features.features.findIndex((f) => f.key === key);
  if (index === -1) return;

  state.showEditFeature = false;
  state.selectedFeature = features.features[index];
  state.showDeleteFeature = true;
}

async function onConfirmDelete(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    const index = features.features.findIndex(
      (f) => f.key === state.selectedFeature?.key,
    );
    if (index === -1) return;

    const feature = client.features.wrapDTO(state.selectedFeature);
    await feature.delete();

    features.features.splice(index, 1);
    toasts.toast({
      id: 'feature-deleted',
      message: 'Feature flag deleted successfully',
      type: ToastType.Success,
    });
  });

  state.showDeleteFeature = false;
  state.selectedFeature = undefined;
  state.isDeleting = false;
}

function onCancelDelete(): void {
  state.showDeleteFeature = false;
  state.selectedFeature = undefined;
}
</script>
