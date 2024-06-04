<template>
  <PageTitle :title="title" />
  <RequireAuth>
    <BreadCrumbs :items="Breadcrumbs" />
    <FormBox>
      <NotFound v-if="!state.profile" />
      <EditProfile
        v-else-if="canEdit"
        :profile="state.profile"
        :tanks="state.tanks"
        @save-profile="onSave"
      />
      <ViewProfile v-else :profile="state.profile" />
    </FormBox>
  </RequireAuth>
</template>

<script setup lang="ts">
import { ListTanksResponseDTO, ProfileDTO, UserRole } from '@bottomtime/api';

import { computed, onServerPrefetch, reactive, useSSRContext } from 'vue';
import { useRoute } from 'vue-router';

import { useClient } from '../api-client';
import { Breadcrumb } from '../common';
import BreadCrumbs from '../components/common/bread-crumbs.vue';
import FormBox from '../components/common/form-box.vue';
import NotFound from '../components/common/not-found.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import EditProfile from '../components/users/edit-profile.vue';
import ViewProfile from '../components/users/view-profile.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

interface ProfileViewState {
  profile?: ProfileDTO;
  tanks: ListTanksResponseDTO;
}

const Breadcrumbs: Breadcrumb[] = [
  {
    label: 'Profile',
    active: true,
  },
];

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : undefined;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();
const route = useRoute();

const state = reactive<ProfileViewState>({
  profile: initialState?.currentProfile,
  tanks: initialState?.tanks ?? {
    tanks: [],
    totalCount: 0,
  },
});

const canEdit = computed(() => {
  if (!currentUser.user) return false;

  return (
    currentUser.user.role === UserRole.Admin ||
    currentUser.user.id === state.profile?.userId
  );
});

const title = computed(() => {
  if (canEdit.value) {
    return 'Manage Profile';
  } else if (state.profile) {
    return state.profile.name || `@${state.profile.username}`;
  } else {
    return '';
  }
});

onServerPrefetch(async () => {
  let username: string | undefined;
  if (typeof route.params.username === 'string') {
    username = route.params.username;
  } else if (currentUser.user?.username) {
    username = currentUser.user.username;
  } else {
    return;
  }

  // TODO: Fix this.
  state.profile = currentUser.user.profile;
  if (ctx) ctx.currentProfile = state.profile;

  await oops(async () => {
    const [profile, tanks] = await Promise.all([
      client.users.getProfile(username),
      client.tanks.listTanks({ username, includeSystem: false }),
    ]);
    state.profile = profile;
    state.tanks = {
      tanks: tanks.tanks.map((tank) => tank.toJSON()),
      totalCount: tanks.totalCount,
    };

    if (ctx) {
      ctx.currentProfile = state.profile;
      ctx.tanks = state.tanks;
    }
  });
});

function onSave(updated: ProfileDTO) {
  state.profile = updated;
  if (currentUser.user?.id === updated.userId) {
    currentUser.user.profile = updated;
  }
}
</script>
