<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="Breadcrumbs" />

  <template v-if="enableDiveOperators.value && operators.currentDiveOperator">
    <EditDiveOperator
      v-if="canEdit"
      :operator="operators.currentDiveOperator"
      :is-saving="isSaving"
      @save="saveChanges"
    />

    <ViewDiveOperator v-else :operator="operators.currentDiveOperator" />
  </template>

  <NotFound v-else />
</template>

<script lang="ts" setup>
import { CreateOrUpdateDiveOperatorDTO, UserRole } from '@bottomtime/api';
import { ManageDiveOperatorsFeature } from '@bottomtime/common';

import { computed, onServerPrefetch, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb, ToastType } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
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
  return typeof route.params.shopKey === 'string'
    ? route.params.shopKey
    : route.params.shopKey[0];
});
const title = computed(() =>
  canEdit.value
    ? `Edit "${operators.currentDiveOperator?.name}"`
    : operators.currentDiveOperator?.name || 'View Dive Operator',
);

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

async function saveChanges(
  update: CreateOrUpdateDiveOperatorDTO,
): Promise<void> {
  const slugChanged = operators.currentDiveOperator?.slug !== update.slug;
  isSaving.value = true;

  await oops(
    async () => {
      const operator = client.diveOperators.wrapDTO({
        ...operators.currentDiveOperator,
      });

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
