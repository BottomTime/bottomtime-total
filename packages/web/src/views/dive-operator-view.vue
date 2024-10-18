<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="Breadcrumbs" />

  <template v-if="enableDiveOperators.value && operators.currentDiveOperator">
    <RequireAuth :authorizer="isAuthorized">
      <EditDiveOperator
        v-if="canEdit"
        :operator="operators.currentDiveOperator"
        :is-saving="isSaving"
        @save="saveChanges"
      />

      <ViewDiveOperator v-else :operator="operators.currentDiveOperator" />
    </RequireAuth>
  </template>

  <NotFound v-else />
</template>

<script lang="ts" setup>
import {
  AccountTier,
  CreateOrUpdateDiveOperatorDTO,
  UserRole,
} from '@bottomtime/api';
import { ManageDiveOperatorsFeature } from '@bottomtime/common';

import { computed, onServerPrefetch, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth2.vue';
import EditDiveOperator from '../components/operators/edit-dive-operator.vue';
import ViewDiveOperator from '../components/operators/view-dive-operator.vue';
import { useFeature } from '../featrues';
import { useOops } from '../oops';
import { useCurrentUser, useDiveOperators, useToasts } from '../store';

const client = useClient();
const currentUser = useCurrentUser();
const enableDiveOperators = useFeature(ManageDiveOperatorsFeature);
const oops = useOops();
const operators = useDiveOperators();
const route = useRoute();
const router = useRouter();
const toasts = useToasts();

const canEdit = computed(() => {
  // User must be authenticated and dive operator must exist
  if (!operators.currentDiveOperator || !currentUser.user) return false;

  // Admins can edit any dive operator, regardless of state.
  if (currentUser.user.role === UserRole.Admin) return true;

  // Dive operator owners can edit their own entries as long as their shops have not already been verified.
  if (operators.currentDiveOperator.owner.userId === currentUser.user.id) {
    return true;
  }

  // Default to false in all other cases.
  return false;
});
const isSaving = ref(false);

const operatorKey = computed(() => {
  if (!route.params.shopKey) return null;
  return typeof route.params.shopKey === 'string'
    ? route.params.shopKey
    : route.params.shopKey[0];
});
const title = computed(() => {
  if (!operatorKey.value) return 'Create New Dive Shop';
  if (canEdit.value) return `Edit "${operators.currentDiveOperator?.name}"`;
  return operators.currentDiveOperator?.name || 'View Dive Operator';
});
const isAuthorized = computed<boolean>(() => {
  if (operatorKey.value) return true;

  return (
    !!currentUser.user && currentUser.user.accountTier >= AccountTier.ShopOwner
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
        operators.currentDiveOperator = {
          active: true,
          address: '',
          description: '',
          createdAt: new Date(),
          id: '',
          name: '',
          owner: currentUser.user!.profile,
          slug: '',
          updatedAt: new Date(),
          verified: false,
        };
        return;
      }

      const operator = await client.diveOperators.getDiveOperator(
        operatorKey.value,
      );
      operators.currentDiveOperator = operator.toJSON();
    },
    {
      [404]: () => {
        operators.currentDiveOperator = null;
      },
    },
  );
});

async function createNewOperator(
  update: CreateOrUpdateDiveOperatorDTO,
): Promise<void> {
  const operator = await client.diveOperators.createDiveOperator(update);
  operators.currentDiveOperator = operator.toJSON();
  await router.push(`/shops/${operator.slug}`);

  toasts.toast({
    id: 'dive-operator-saved',
    message: 'Dive operator saved successfully',
    type: ToastType.Success,
  });
}

async function updateExistingOperator(
  update: CreateOrUpdateDiveOperatorDTO,
): Promise<void> {
  const slugChanged = operators.currentDiveOperator?.slug !== update.slug;
  const operator = client.diveOperators.wrapDTO({
    ...operators.currentDiveOperator,
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
  operators.currentDiveOperator = operator.toJSON();

  if (slugChanged) {
    // Redirect to the new slug if it has changed.
    await router.replace({
      name: 'dive-operator',
      params: { shopKey: operator.slug },
    });
  }
}

async function saveChanges(
  update: CreateOrUpdateDiveOperatorDTO,
): Promise<void> {
  isSaving.value = true;

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

  isSaving.value = false;
}
</script>
