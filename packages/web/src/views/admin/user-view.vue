<template>
  <PageTitle :title="title" :subtitle="subtitle" />
  <RequireAuth :role="role">
    <BreadCrumbs :items="breadcrumbs" />
    <div class="grid grid-cols-1 lg:grid-cols-6">
      <div class="lg:col-start-2 lg:col-span-4">
        <ManageUser
          v-if="admin.currentUser"
          :user="admin.currentUser"
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

import { computed, onServerPrefetch } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb } from '../../common';
import ManageUser from '../../components/admin/manage-user.vue';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth.vue';
import { useOops } from '../../oops';
import { useAdmin } from '../../store';

// Dependencies
const admin = useAdmin();
const client = useClient();
const currentRoute = useRoute();
const oops = useOops();

// Component state
const role = computed(() => UserRole.Admin);
const title = computed(() => admin.currentUser?.username || 'Manage User');
const subtitle = computed(() =>
  admin.currentUser?.profile.name ? `(${admin.currentUser?.profile.name})` : '',
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

onServerPrefetch(async () => {
  admin.currentUser = await fetchUser();
});

// Event handlers
function onAccountLockToggled() {
  if (admin.currentUser) {
    admin.currentUser.isLockedOut = !admin.currentUser.isLockedOut;
  }
}

function onEmailChanged(_: string, email: string) {
  if (admin.currentUser) {
    admin.currentUser.email = email;
    admin.currentUser.emailVerified = false;
  }
}

function onPasswordReset() {
  if (admin.currentUser) {
    admin.currentUser.hasPassword = true;
    admin.currentUser.lastPasswordChange = new Date();
  }
}

function onRoleChanged(_: string, newRole: UserRole) {
  if (admin.currentUser) {
    admin.currentUser.role = newRole;
  }
}

function onUsernameChanged(_: string, username: string) {
  if (admin.currentUser) {
    admin.currentUser.username = username;
  }
}

function onSaveProfile(_: string, profile: ProfileDTO) {
  if (admin.currentUser) {
    admin.currentUser.profile = profile;
  }
}

function onSaveSettings(_: string, settings: UserSettingsDTO) {
  if (admin.currentUser) {
    admin.currentUser.settings = settings;
  }
}
</script>
