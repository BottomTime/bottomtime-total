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
      <span class="font-bold">{{ state.currentOperator?.name }}</span>
      ?
    </p>
    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <template v-if="enableDiveOperators.value && state.currentOperator">
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
        :operator="state.currentOperator"
        :is-saving="state.isSaving"
        @save="onSave"
        @delete="onDelete"
        @logo-changed="onLogoChanged"
        @verification-requested="onVerificationRequested"
        @verified="onVerified"
        @rejected="onVerificationRejected"
      />

      <ViewOperator v-else :operator="state.currentOperator" />
    </RequireAuth>
  </template>

  <NotFound v-else />
</template>

<script lang="ts" setup>
import {
  AccountTier,
  CreateOrUpdateOperatorDTO,
  LogBookSharing,
  OperatorDTO,
  UserRole,
  VerificationStatus,
} from '@bottomtime/api';
import { ManageDiveOperatorsFeature } from '@bottomtime/common';

import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb, ToastType } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth2.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import EditOperator from '../../components/operators/edit-operator.vue';
import ViewOperator from '../../components/operators/view-operator.vue';
import { useFeature } from '../../featrues';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';

interface OperatorViewState {
  currentOperator?: OperatorDTO;
  isSaving: boolean;
  isDeleted: boolean;
  isDeleting: boolean;
  showConfirmDeleteDialog: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
const enableDiveOperators = useFeature(ManageDiveOperatorsFeature);
const oops = useOops();
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
  if (!state.currentOperator || !currentUser.user) return false;

  // Admins can edit any dive operator, regardless of state.
  if (currentUser.user.role === UserRole.Admin) return true;

  // Dive operator owners can edit their own entries.
  if (state.currentOperator.owner.userId === currentUser.user.id) {
    return true;
  }

  // Default to false in all other cases.
  return false;
});

const operatorKey = computed(() => {
  if (!route.params.shopKey) return undefined;
  return typeof route.params.shopKey === 'string'
    ? route.params.shopKey
    : route.params.shopKey[0];
});

const title = computed(() => {
  if (!operatorKey.value) return 'Create New Dive Shop';
  if (canEdit.value) return `Edit "${state.currentOperator?.name}"`;
  return state.currentOperator?.name || 'View Dive Operator';
});

const isAuthorized = computed<boolean>(() => {
  // Any user can view an existing dive operator.
  if (operatorKey.value) return true;

  // Only users with Shop Owner-tiered memberships and admins can create new shops.
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

onMounted(async () => {
  await oops(
    async () => {
      // If no key is present then we are on the "Create New Dive Shop" page. No need to fetch anything.
      if (operatorKey.value) {
        const operator = await client.operators.getOperator(operatorKey.value);
        state.currentOperator = operator.toJSON();
      } else {
        state.currentOperator = {
          active: true,
          address: '',
          description: '',
          createdAt: new Date(),
          id: '',
          name: '',
          owner: currentUser.user?.profile ?? {
            accountTier: AccountTier.Basic,
            logBookSharing: LogBookSharing.Private,
            memberSince: new Date(),
            userId: '',
            username: '',
          },
          slug: '',
          updatedAt: new Date(),
          verificationStatus: VerificationStatus.Unverified,
        };
      }
    },
    {
      [404]: () => {
        state.currentOperator = undefined;
      },
    },
  );
});

async function createNewOperator(
  update: CreateOrUpdateOperatorDTO,
): Promise<void> {
  const operator = await client.operators.createOperator(update);
  state.currentOperator = operator.toJSON();
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
  const slugChanged = state.currentOperator?.slug !== update.slug;
  const operator = client.operators.wrapDTO({
    ...state.currentOperator,
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
  state.currentOperator = operator.toJSON();

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
    const operator = client.operators.wrapDTO(state.currentOperator!);
    await operator.delete();

    state.showConfirmDeleteDialog = false;
    state.isDeleting = false;

    toasts.toast({
      id: 'dive-operator-deleted',
      message: 'Dive operator deleted successfully',
      type: ToastType.Success,
    });

    setTimeout(() => {
      router.push('/shops');
    }, 1000);
  });

  state.isDeleted = true;
}

function onCancelDelete() {
  state.showConfirmDeleteDialog = false;
}

function onVerificationRequested() {
  if (state.currentOperator) {
    state.currentOperator.verificationStatus = VerificationStatus.Pending;
    state.currentOperator.verificationMessage = undefined;
  }
}

function onVerified(message?: string) {
  if (state.currentOperator) {
    state.currentOperator.verificationStatus = VerificationStatus.Verified;
    state.currentOperator.verificationMessage = message;
  }
}

function onVerificationRejected(message?: string) {
  if (state.currentOperator) {
    state.currentOperator.verificationStatus = VerificationStatus.Rejected;
    state.currentOperator.verificationMessage = message;
  }
}

function onLogoChanged(url?: string) {
  if (state.currentOperator) {
    state.currentOperator.logo = url;
  }
}
</script>
