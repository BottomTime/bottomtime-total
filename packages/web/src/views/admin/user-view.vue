<template>
  <PageTitle :title="title" :subtitle="subtitle" />
  <RequireAuth :authorizer="isAuthorized">
    <BreadCrumbs :items="breadcrumbs" />

    <div v-if="state.isLoading" class="flex justify-center text-xl my-8">
      <LoadingSpinner message="Fetching user..." />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-6">
      <div class="lg:col-start-2 lg:col-span-4">
        <ManageUser
          v-if="state.currentUser"
          :user="state.currentUser"
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

import { computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb } from '../../common';
import ManageUser from '../../components/admin/manage-user.vue';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth2.vue';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';

interface UserViewState {
  currentUser?: UserDTO;
  isLoading: boolean;
}

// Dependencies
const client = useClient();
const currentUser = useCurrentUser();
const route = useRoute();
const oops = useOops();

// Component state
const state = reactive<UserViewState>({
  isLoading: true,
});
const title = computed(() => state.currentUser?.username || 'Manage User');
const subtitle = computed(() =>
  state.currentUser?.profile.name ? `(${state.currentUser?.profile.name})` : '',
);
const isAuthorized = computed(() => currentUser.user?.role === UserRole.Admin);

const breadcrumbs: Breadcrumb[] = [
  { label: 'Admin', to: '/admin' },
  { label: 'Users', to: '/admin/users' },
  { label: title, active: true },
];

// Fetch the user data
async function fetchUser(): Promise<void> {
  const username = route.params.username as string;
  await oops(
    async () => {
      if (!isAuthorized.value) return;
      state.currentUser = await client.userAccounts.getUser(username);
    },
    {
      404: () => {
        // No-op: prevent redirecting to 404 page
      },
    },
  );

  state.isLoading = false;
}

// Event handlers
function onAccountLockToggled() {
  if (state.currentUser) {
    state.currentUser.isLockedOut = !state.currentUser.isLockedOut;
  }
}

function onEmailChanged(_: string, email: string) {
  if (state.currentUser) {
    state.currentUser.email = email;
    state.currentUser.emailVerified = false;
  }
}

function onPasswordReset() {
  if (state.currentUser) {
    state.currentUser.hasPassword = true;
    state.currentUser.lastPasswordChange = new Date();
  }
}

function onRoleChanged(_: string, newRole: UserRole) {
  if (state.currentUser) {
    state.currentUser.role = newRole;
  }
}

function onUsernameChanged(_: string, username: string) {
  if (state.currentUser) {
    state.currentUser.username = username;
  }
}

function onSaveProfile(_: string, profile: ProfileDTO) {
  if (state.currentUser) {
    state.currentUser.profile = profile;
  }
}

function onSaveSettings(_: string, settings: UserSettingsDTO) {
  if (state.currentUser) {
    state.currentUser.settings = settings;
  }
}

onMounted(fetchUser);
</script>
