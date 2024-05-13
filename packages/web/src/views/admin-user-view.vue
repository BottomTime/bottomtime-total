<template>
  <PageTitle :title="title" :subtitle="subtitle" />
  <RequireAuth :role="role">
    <BreadCrumbs :items="breadcrumbs" />
    <div class="grid grid-cols-1 lg:grid-cols-6">
      <div class="lg:col-start-2 lg:col-span-4">
        <ManageUser
          v-if="user"
          :user="user"
          @account-lock-toggled="onAccountLockToggled"
          @email-changed="onEmailChanged"
          @password-reset="onPasswordReset"
          @role-changed="onRoleChanged"
          @username-changed="onUsernameChanged"
          @save-profile="onSaveProfile"
          @save-settings="onSaveSettings"
        />
        <NotFound v-else />
      </div>
    </div>
  </RequireAuth>
</template>

<script setup lang="ts">
import {
  ProfileDTO,
  UserDTO,
  UserRole,
  UserSettingsDTO,
} from '@bottomtime/api';

import {
  computed,
  onBeforeMount,
  onServerPrefetch,
  ref,
  useSSRContext,
} from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import ManageUser from '../components/admin/manage-user.vue';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';

// Dependencies
const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : undefined;
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
  { label: 'Admin', to: '/admin' },
  { label: 'Users', to: '/admin/users' },
  { label: title, active: true },
];

// Fetch the user data
async function fetchUser(): Promise<UserDTO | null> {
  const username = currentRoute.params.username as string;
  return await oops(
    async () => {
      const result = await client.users.getUser(username);
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
  const userData = await fetchUser();
  user.value = userData;
  if (ctx) ctx.adminCurrentUser = user.value ?? undefined;
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

function onUsernameChanged(_: string, username: string) {
  if (user.value) {
    user.value.username = username;
  }
}

function onSaveProfile(_: string, profile: ProfileDTO) {
  if (user.value) {
    user.value.profile = profile;
  }
}

function onSaveSettings(_: string, settings: UserSettingsDTO) {
  if (user.value) {
    user.value.settings = settings;
  }
}
</script>
