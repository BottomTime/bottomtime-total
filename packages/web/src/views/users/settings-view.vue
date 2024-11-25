<template>
  <PageTitle title="Settings" />
  <RequireAuth>
    <div class="grid grid-cols-1 lg:grid-cols-5">
      <div class="lg:col-start-2 lg:col-span-3 space-y-3">
        <FormBox>
          <EditSettings
            v-if="currentUser.user"
            :user="currentUser.user"
            @save-settings="onSave"
          />
        </FormBox>

        <FormBox v-if="notificationsEnabled.value">
          <ManageNotifications
            v-if="currentUser.user"
            :user="currentUser.user"
          />
        </FormBox>
      </div>
    </div>
  </RequireAuth>
</template>

<script setup lang="ts">
import { UserSettingsDTO } from '@bottomtime/api';
import { NotificationsFeature } from '@bottomtime/common';

import FormBox from '../../components/common/form-box.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth.vue';
import EditSettings from '../../components/users/edit-settings.vue';
import ManageNotifications from '../../components/users/manage-notifications.vue';
import { useFeature } from '../../featrues';
import { useCurrentUser } from '../../store';

const currentUser = useCurrentUser();
const notificationsEnabled = useFeature(NotificationsFeature);

function onSave(settings: UserSettingsDTO) {
  if (currentUser.user) {
    currentUser.user.settings = settings;
  }
}
</script>
