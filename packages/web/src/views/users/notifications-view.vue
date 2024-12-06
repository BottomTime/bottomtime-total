<template>
  <PageTitle title="Notifications" />
  <template v-if="notificationsFeature.value">
    <RequireAuth2>
      <LoadingSpinner
        v-if="state.isLoading"
        message="Fetching notifications..."
      />
      <div v-else>
        <NotificationsList />
        {{ JSON.stringify(state.notifications) }}
      </div>
    </RequireAuth2>
  </template>
  <NotFound v-else />
</template>

<script lang="ts" setup>
import { ApiList, NotificationDTO } from '@bottomtime/api';
import { NotificationsFeature } from '@bottomtime/common';

import NotificationsList from '@/components/users/notifications-list.vue';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth2 from '../../components/common/require-auth2.vue';
import { useFeature } from '../../featrues';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';

interface NotificationsViewState {
  isLoading: boolean;
  notifications: ApiList<NotificationDTO>;
}

const client = useClient();
const oops = useOops();
const currentUser = useCurrentUser();
const notificationsFeature = useFeature(NotificationsFeature);

const state = reactive<NotificationsViewState>({
  isLoading: true,
  notifications: {
    data: [],
    totalCount: 0,
  },
});

async function refreshNotifications(): Promise<void> {
  state.isLoading = true;
  await oops(async () => {
    if (!currentUser.user) return;

    state.notifications = await client.notifications.listNotifications(
      currentUser.user.username,
      {
        showDismissed: false,
      },
    );
  });
  state.isLoading = false;
}

onMounted(refreshNotifications);
</script>
