<template>
  <PageTitle :title="title" />
  <RequireAuth>
    <FormBox>
      <NotFound v-if="!profile" />
      <EditProfile
        v-else-if="canEdit"
        :profile="profile"
        @save-profile="onSave"
      />
      <ViewProfile v-else :profile />
    </FormBox>
  </RequireAuth>
</template>

<script setup lang="ts">
import { ProfileDTO, UserRole } from '@bottomtime/api';

import { computed, onServerPrefetch, ref, useSSRContext } from 'vue';
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

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : undefined;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();
const route = useRoute();

const profile = ref<ProfileDTO | null>(initialState?.currentProfile ?? null);

const canEdit = computed(() => {
  if (!currentUser.user) return false;

  return (
    currentUser.user.role === UserRole.Admin ||
    currentUser.user.id === profile.value?.userId
  );
});

const title = computed(() => {
  if (canEdit.value) {
    return 'Manage Profile';
  } else if (profile.value) {
    return profile.value.name || `@${profile.value.username}`;
  } else {
    return '';
  }
});

onServerPrefetch(async () => {
  if (!currentUser.user) return;

  const username = route.params.username;
  if (typeof username !== 'string') {
    profile.value = currentUser.user.profile;
    if (ctx) ctx.currentProfile = profile.value;
    return;
  }

  await oops(async () => {
    profile.value = await client.users.getProfile(username);
    if (ctx) ctx.currentProfile = profile.value;
  });
});

function onSave(updated: ProfileDTO) {
  profile.value = updated;
  if (currentUser.user?.id === updated.userId) {
    currentUser.user.profile = updated;
  }
}
</script>
