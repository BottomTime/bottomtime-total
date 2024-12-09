<template>
  <PageTitle title="Notifications" />
  <template v-if="notificationsFeature.value">
    <ConfirmDialog
      confirm-text="Delete"
      dangerous
      icon="fa-solid fa-trash fa-2x"
      title="Delete notification?"
      :visible="state.showDeleteDialog"
      :is-loading="state.isDeleting"
      @confirm="onConfirmDelete"
      @cancel="onCancelDelete"
    >
      <p v-if="Array.isArray(state.selectedNotifications)"></p>
      <p v-else-if="!!state.selectedNotifications">
        Are you sure you want to delete
        <span class="font-bold">"{{ state.selectedNotifications.title }}"</span
        >?
      </p>

      <p>This action cannot be undone.</p>
    </ConfirmDialog>

    <RequireAuth2>
      <NotificationsList
        :notifications="state.notifications"
        :is-loading="state.isLoading"
        @delete="onDelete"
      />
    </RequireAuth2>
  </template>
  <NotFound v-else />
</template>

<script lang="ts" setup>
import { ApiList, NotificationDTO } from '@bottomtime/api';
import { NotificationsFeature } from '@bottomtime/common';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth2 from '../../components/common/require-auth2.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import NotificationsList from '../../components/users/notifications-list.vue';
import { useFeature } from '../../featrues';
import { useOops } from '../../oops';
import { useCurrentUser, useNotifications, useToasts } from '../../store';

interface NotificationsViewState {
  isDeleting: boolean;
  isLoading: boolean;
  notifications: ApiList<NotificationDTO>;
  selectedNotifications?: NotificationDTO | NotificationDTO[];
  showDeleteDialog: boolean;
}

const client = useClient();
const oops = useOops();
const currentUser = useCurrentUser();
const notificationsFeature = useFeature(NotificationsFeature);
const notificationStore = useNotifications();
const toasts = useToasts();

const state = reactive<NotificationsViewState>({
  isDeleting: false,
  isLoading: true,
  notifications: {
    data: [],
    totalCount: 0,
  },
  showDeleteDialog: false,
});

async function refreshNotifications(): Promise<void> {
  state.isLoading = true;
  await oops(async () => {
    if (!currentUser.user) return;

    state.notifications = await client.notifications.listNotifications(
      currentUser.user.username,
      {
        showDismissed: true,
      },
    );
  });
  state.isLoading = false;
}

function onDelete(notifications: NotificationDTO | NotificationDTO[]): void {
  state.selectedNotifications = notifications;
  state.showDeleteDialog = true;
}

function onCancelDelete(): void {
  state.showDeleteDialog = false;
}

async function onConfirmDelete(): Promise<void> {
  if (
    Array.isArray(state.selectedNotifications) ||
    !state.selectedNotifications
  ) {
    return;
  }

  state.isDeleting = true;

  // TODO: Lolol
  await oops(async () => {
    if (!currentUser.user) return;
    await client.notifications.deleteNotifications(
      currentUser.user.username,
      (state.selectedNotifications as NotificationDTO).id,
    );
  });

  const index = state.notifications.data.findIndex(
    (n) => n.id === (state.selectedNotifications as NotificationDTO).id,
  );
  if (index > -1) {
    state.notifications.data.splice(index, 1);
    state.notifications.totalCount--;
  }
  notificationStore.removeNotifications([state.selectedNotifications.id]);

  toasts.toast({
    id: 'notification-deleted',
    message: 'Notification deleted.',
    type: ToastType.Success,
  });

  state.showDeleteDialog = false;
  state.isDeleting = false;
}

onMounted(refreshNotifications);
</script>
