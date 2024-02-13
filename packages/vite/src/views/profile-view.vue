<template>
  <PageTitle title="Manage Profile" />
  <RequireAuth>
    <div class="grid grid-cols-6">
      <FormBox class="col-start-2 col-span-4">
        <EditProfile :user="currentUser.user!" @save-profile="onSave" />
      </FormBox>
    </div>
  </RequireAuth>
</template>

<script setup lang="ts">
import { ProfileDTO } from '@bottomtime/api';

import FormBox from '../components/common/form-box.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import EditProfile from '../components/users/edit-profile.vue';
import { useCurrentUser } from '../store';

const currentUser = useCurrentUser();

function onSave(profile: ProfileDTO) {
  if (currentUser.user) {
    currentUser.user.profile = profile;
  }
}
</script>
