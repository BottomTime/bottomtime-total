<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="Breadcrumbs" />

  <ConfirmDialog
    title="Delete Shop?"
    confirm-text="Delete"
    icon="fa-solid fa-trash fa-2x"
    dangerous
    :visible="state.showConfirmDeleteDialog"
    :is-loading="state.isDeleting"
    @confirm="onConfirmDelete"
    @cancel="onCancelDelete"
  >
    <p>
      Are you sure you want to delete
      <span class="font-bold">{{ operators.currentOperator?.name }}</span>
      ?
    </p>
    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <template v-if="enableDiveOperators.value && operators.currentOperator">
    <RequireAuth :authorizer="isAuthorized">
      <p
        v-if="state.isDeleted"
        class="w-full my-8 text-center text-xl space-x-4"
        data-testid="deleted-message"
      >
        <span>
          <i class="fa-solid fa-circle-info"></i>
        </span>
        <span>Shop deleted</span>
      </p>

      <EditOperator
        v-else-if="canEdit"
        :operator="operators.currentOperator"
        :is-saving="state.isSaving"
        @save="onSave"
        @delete="onDelete"
        @logo-changed="onLogoChanged"
        @verification-requested="onVerificationRequested"
        @verified="onVerified"
        @rejected="onVerificationRejected"
      />

      <ViewOperator v-else :operator="operators.currentOperator" />
    </RequireAuth>
  </template>

  <NotFound v-else />
</template>

<script lang="ts" setup>
import {
  AccountTier,
  CreateOrUpdateOperatorDTO,
  UserRole,
  VerificationStatus,
} from '@bottomtime/api';
import { ManageDiveOperatorsFeature } from '@bottomtime/common';

import { computed, onServerPrefetch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth2.vue';
import ConfirmDialog from '../components/dialog/confirm-dialog.vue';
import EditOperator from '../components/operators/edit-operator.vue';
import ViewOperator from '../components/operators/view-operator.vue';
import { useFeature } from '../featrues';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useCurrentUser, useOperators, useToasts } from '../store';

interface OperatorViewState {
  isSaving: boolean;
  isDeleted: boolean;
  isDeleting: boolean;
  showConfirmDeleteDialog: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
const enableDiveOperators = useFeature(ManageDiveOperatorsFeature);
const location = useLocation();
const oops = useOops();
const operators = useOperators();
const route = useRoute();
const router = useRouter();
const toasts = useToasts();

const state = reactive<OperatorViewState>({
  isSaving: false,
  isDeleted: false,
  isDeleting: false,
  showConfirmDeleteDialog: false,
});

const canEdit = computed(() => {
  // User must be authenticated and dive operator must exist
  if (!operators.currentOperator || !currentUser.user) return false;

  // Admins can edit any dive operator, regardless of state.
  if (currentUser.user.role === UserRole.Admin) return true;

  // Dive operator owners can edit their own entries as long as their shops have not already been verified.
  if (operators.currentOperator.owner.userId === currentUser.user.id) {
    return true;
  }

  // Default to false in all other cases.
  return false;
});

const operatorKey = computed(() => {
  if (!route.params.shopKey) return null;
  return typeof route.params.shopKey === 'string'
    ? route.params.shopKey
    : route.params.shopKey[0];
});

const title = computed(() => {
  if (!operatorKey.value) return 'Create New Dive Shop';
  if (canEdit.value) return `Edit "${operators.currentOperator?.name}"`;
  return operators.currentOperator?.name || 'View Dive Operator';
});

const isAuthorized = computed<boolean>(() => {
  if (operatorKey.value) return true;

  return (
    !!currentUser.user &&
    (currentUser.user.role === UserRole.Admin ||
      currentUser.user.accountTier >= AccountTier.ShopOwner)
  );
});

const Breadcrumbs: Breadcrumb[] = [
  {
    label: 'Dive Shops',
    to: '/shops',
  },
  {
    label: title,
    active: true,
  },
] as const;

onServerPrefetch(async () => {
  await oops(
    async () => {
      // If no key is present then we are on the "Create New Dive Shop" page. No need to fetch anything.
      if (!operatorKey.value) {
        operators.currentOperator = {
          active: true,
          address: '',
          description: '',
          createdAt: new Date(),
          id: '',
          name: '',
          owner: currentUser.user!.profile,
          slug: '',
          updatedAt: new Date(),
          verificationStatus: VerificationStatus.Unverified,
        };
        return;
      }

      const operator = await client.operators.getOperator(operatorKey.value);
      operators.currentOperator = operator.toJSON();
    },
    {
      [404]: () => {
        operators.currentOperator = null;
      },
    },
  );
});

async function createNewOperator(
  update: CreateOrUpdateOperatorDTO,
): Promise<void> {
  const operator = await client.operators.createOperator(update);
  operators.currentOperator = operator.toJSON();
  await router.push(`/shops/${operator.slug}`);

  toasts.toast({
    id: 'dive-operator-saved',
    message: 'Dive operator saved successfully',
    type: ToastType.Success,
  });
}

async function updateExistingOperator(
  update: CreateOrUpdateOperatorDTO,
): Promise<void> {
  const slugChanged = operators.currentOperator?.slug !== update.slug;
  const operator = client.operators.wrapDTO({
    ...operators.currentOperator,
  });

  operator.active = update.active;
  operator.address = update.address;
  operator.description = update.description;
  operator.email = update.email;
  operator.gps = update.gps;
  operator.name = update.name;
  operator.phone = update.phone;
  operator.slug = update.slug || operator.slug;
  operator.socials = update.socials;
  operator.website = update.website;

  await operator.save();

  toasts.toast({
    id: 'dive-operator-saved',
    message: 'Dive operator saved successfully',
    type: ToastType.Success,
  });
  operators.currentOperator = operator.toJSON();

  if (slugChanged) {
    // Redirect to the new slug if it has changed.
    await router.replace({
      name: 'dive-operator',
      params: { shopKey: operator.slug },
    });
  }
}

async function onSave(update: CreateOrUpdateOperatorDTO): Promise<void> {
  state.isSaving = true;

  await oops(
    async () => {
      // Create new operator if this is a brand new entry.
      if (!operatorKey.value) await createNewOperator(update);
      else await updateExistingOperator(update);
    },
    {
      [409]: () => {
        // Slug is already taken.
        toasts.toast({
          id: 'dive-operator-slug-taken',
          message:
            'Your chosen URL shortcut is already in use. Please choose another.',
          type: ToastType.Warning,
        });
      },
    },
  );

  state.isSaving = false;
}

function onDelete() {
  state.showConfirmDeleteDialog = true;
}

async function onConfirmDelete(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    const operator = client.operators.wrapDTO(operators.currentOperator!);
    await operator.delete();

    state.showConfirmDeleteDialog = false;
    state.isDeleting = false;

    toasts.toast({
      id: 'dive-operator-deleted',
      message: 'Dive operator deleted successfully',
      type: ToastType.Success,
    });

    setTimeout(() => {
      location.assign('/shops');
    }, 1000);
  });

  state.isDeleted = true;
}

function onCancelDelete() {
  state.showConfirmDeleteDialog = false;
}

function onVerificationRequested() {
  if (operators.currentOperator) {
    operators.currentOperator.verificationStatus = VerificationStatus.Pending;
    operators.currentOperator.verificationMessage = undefined;
  }
}

function onVerified(message?: string) {
  if (operators.currentOperator) {
    operators.currentOperator.verificationStatus = VerificationStatus.Verified;
    operators.currentOperator.verificationMessage = message;
  }
}

function onVerificationRejected(message?: string) {
  if (operators.currentOperator) {
    operators.currentOperator.verificationStatus = VerificationStatus.Rejected;
    operators.currentOperator.verificationMessage = message;
  }
}

function onLogoChanged(url?: string) {
  if (operators.currentOperator) {
    operators.currentOperator.logo = url;
  }
}
</script>
