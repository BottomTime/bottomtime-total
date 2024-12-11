<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="Breadcrumbs" />
  <RequireAuth>
    <div v-if="state.isLoading" clas="flex justify-center my-8 text-xl">
      <LoadingSpinner message="Fetching profile info..." />
    </div>

    <NotFound v-else-if="!state.currentProfile" />

    <EditProfile
      v-else-if="canEdit"
      :profile="state.currentProfile"
      :tanks="state.tanks.totalCount > -1 ? state.tanks : undefined"
      @save-profile="onSave"
    />
    <ViewProfile v-else :profile="state.currentProfile" />
  </RequireAuth>
</template>

<script setup lang="ts">
import { ApiList, ProfileDTO, TankDTO, UserRole } from '@bottomtime/api';

import { computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth.vue';
import EditProfile from '../../components/users/edit-profile.vue';
import ViewProfile from '../../components/users/view-profile.vue';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';

interface ProfileViewState {
  currentProfile?: ProfileDTO;
  isLoading: boolean;
  tanks: ApiList<TankDTO>;
}

const Breadcrumbs: Breadcrumb[] = [
  {
    label: 'Profile',
    active: true,
  },
];

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();

const canEdit = computed(() => {
  if (!currentUser.user) return false;

  return (
    currentUser.user.role === UserRole.Admin ||
    currentUser.user.id === state.currentProfile?.userId
  );
});

const title = computed(() => {
  if (canEdit.value) {
    return 'Manage Profile';
  } else if (state.currentProfile) {
    return state.currentProfile.name || `@${state.currentProfile.username}`;
  } else {
    return '';
  }
});
const username = computed(() =>
  typeof route.params.username === 'string'
    ? route.params.username
    : currentUser.user?.username ?? '',
);

const state = reactive<ProfileViewState>({
  isLoading: true,
  tanks: {
    data: [],
    totalCount: 0,
  },
});

onMounted(async () => {
  await oops(async () => {
    if (!currentUser.user) return;

    // Determine if we need to fetch the requested profile or whether we are just displaying the current
    // user's profile.
    const currentUserRequested =
      username.value.toLowerCase() === currentUser.user.username.toLowerCase();
    state.currentProfile = currentUserRequested
      ? currentUser.user.profile
      : await client.users.getProfile(username.value);

    // Only Fetch custom tank profiles if the user is viewing their own profile or an admin is.
    if (currentUserRequested || currentUser.user.role === UserRole.Admin) {
      state.tanks = await client.tanks.listTanks({
        username: username.value,
        includeSystem: false,
      });
    } else {
      state.tanks = {
        data: [],
        totalCount: -1,
      };
    }

    state.isLoading = false;
  });
});

function onSave(updated: ProfileDTO) {
  state.currentProfile = updated;
  if (currentUser.user?.id === updated.userId) {
    currentUser.user.profile = updated;
  }
}
</script>
