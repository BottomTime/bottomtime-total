<template>
  <PageTitle :title="title" />
  <BreadCrumbs :items="Breadcrumbs" />
  <RequireAuth>
    <NotFound v-if="!profiles.currentProfile" />
    <EditProfile
      v-else-if="canEdit"
      :profile="profiles.currentProfile"
      :tanks="tanks.results.totalCount > -1 ? tanks.results : undefined"
      @save-profile="onSave"
    />
    <ViewProfile v-else :profile="profiles.currentProfile" />
  </RequireAuth>
</template>

<script setup lang="ts">
import { ProfileDTO, UserRole } from '@bottomtime/api';

import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../../api-client';
import { Breadcrumb } from '../../common';
import BreadCrumbs from '../../components/common/bread-crumbs.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth.vue';
import EditProfile from '../../components/users/edit-profile.vue';
import ViewProfile from '../../components/users/view-profile.vue';
import { useOops } from '../../oops';
import { useCurrentUser, useProfiles, useTanks } from '../../store';

const Breadcrumbs: Breadcrumb[] = [
  {
    label: 'Profile',
    active: true,
  },
];

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const profiles = useProfiles();
const route = useRoute();
const tanks = useTanks();

const canEdit = computed(() => {
  if (!currentUser.user) return false;

  return (
    currentUser.user.role === UserRole.Admin ||
    currentUser.user.id === profiles.currentProfile?.userId
  );
});

const title = computed(() => {
  if (canEdit.value) {
    return 'Manage Profile';
  } else if (profiles.currentProfile) {
    return (
      profiles.currentProfile.name || `@${profiles.currentProfile.username}`
    );
  } else {
    return '';
  }
});

onMounted(async () => {
  if (!currentUser.user) return;

  const username =
    typeof route.params.username === 'string'
      ? route.params.username
      : currentUser.user.username;

  await oops(async () => {
    if (!currentUser.user) return;

    // Determine if we need to fetch the requested profile or whether we are just displaying the current
    // user's profile.
    const currentUserRequested =
      username.toLowerCase() === currentUser.user.username.toLowerCase();
    profiles.currentProfile = currentUserRequested
      ? currentUser.user.profile
      : await client.users.getProfile(username);

    // Only Fetch custom tank profiles if the user is viewing their own profile or an admin is.
    if (currentUserRequested || currentUser.user.role === UserRole.Admin) {
      const results = await client.tanks.listTanks({
        username,
        includeSystem: false,
      });
      tanks.results = {
        tanks: results.tanks.map((tank) => tank.toJSON()),
        totalCount: results.totalCount,
      };
    } else {
      tanks.results = {
        tanks: [],
        totalCount: -1,
      };
    }
  });
});

function onSave(updated: ProfileDTO) {
  profiles.currentProfile = updated;
  if (currentUser.user?.id === updated.userId) {
    currentUser.user.profile = updated;
  }
}
</script>
