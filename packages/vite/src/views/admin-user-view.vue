<template>
  <PageTitle :title="title" :subtitle="subtitle" />
  <RequireAuth :role="role">
    <div class="grid grid-cols-1 lg:grid-cols-6">
      <div class="lg:col-start-2 lg:col-span-4">
        <BreadCrumbs :items="breadcrumbs" />
        <ManageUser
          v-if="user"
          :user="user"
          @account-lock-toggled="onAccountLockToggled"
          @email-changed="onEmailChanged"
          @password-reset="onPasswordReset"
          @role-changed="onRoleChanged"
        />
        <NotFound v-else />
      </div>
    </div>
  </RequireAuth>
</template>

<script setup lang="ts">
import { UserDTO, UserRole } from '@bottomtime/api';

import {
  computed,
  onBeforeMount,
  onServerPrefetch,
  ref,
  useSSRContext,
} from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../client';
import { AppInitialState, Breadcrumb } from '../common';
import ManageUser from '../components/admin/manage-user.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import { Config } from '../config';
import { useInitialState } from '../initial-state';
import { useOops } from '../oops';

// Dependencies
const client = useClient();
const currentRoute = useRoute();
const oops = useOops();

// Component state
const user = ref<UserDTO | null>(null);
const role = computed(() => UserRole.Admin);
const title = computed(() => user.value?.username || 'Manage User');
const subtitle = computed(() =>
  user.value?.profile.name ? `(${user.value?.profile.name})` : '',
);

const breadcrumbs: Breadcrumb[] = [
  { label: 'Admin' },
  { label: 'Users', to: '/admin/users' },
  { label: () => title.value },
];

// Fetch the user data
async function fetchUser(): Promise<UserDTO | null> {
  const username = currentRoute.params.username as string;
  const result = await client.users.getUser(username);
  return await oops(
    async () => {
      return result?.toJSON() ?? null;
    },
    {
      404: () => {
        // No-op: prevent redirecting to 404 page
      },
    },
  );
}

onBeforeMount(async () => {
  if (!Config.isSSR) {
    const ctx = useInitialState();
    user.value = ctx?.adminCurrentUser ?? null;
  }
});

onServerPrefetch(async () => {
  const ctx = useSSRContext<AppInitialState>()!;
  const userData = await fetchUser();

  user.value = userData;
  ctx.adminCurrentUser = user.value ?? undefined;

  user.value = userData;
});

// Event handlers
function onAccountLockToggled() {
  if (user.value) {
    user.value.isLockedOut = !user.value.isLockedOut;
  }
}

function onEmailChanged(_: string, email: string) {
  if (user.value) {
    user.value.email = email;
    user.value.emailVerified = false;
  }
}

function onPasswordReset() {
  if (user.value) {
    user.value.hasPassword = true;
    user.value.lastPasswordChange = new Date();
  }
}

function onRoleChanged(_: string, newRole: UserRole) {
  if (user.value) {
    user.value.role = newRole;
  }
}
</script>
