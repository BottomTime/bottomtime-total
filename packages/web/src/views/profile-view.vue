<template>
  <PageTitle :title="title" />
  <RequireAuth>
    <FormBox>
      <NotFound v-if="!state.profile" />
      <EditProfile
        v-else-if="canEdit"
        :profile="state.profile"
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
  if (!currentUser.user) return;

  const username = route.params.username;
  if (typeof username !== 'string') {
    state.profile = currentUser.user.profile;
    if (ctx) ctx.currentProfile = state.profile;
    return;
  }

  await oops(async () => {
    state.profile = await client.users.getProfile(username);
    if (ctx) ctx.currentProfile = state.profile;
  });
});

function onSave(updated: ProfileDTO) {
  state.profile = updated;
  if (currentUser.user?.id === updated.userId) {
    currentUser.user.profile = updated;
  }
}
</script>
