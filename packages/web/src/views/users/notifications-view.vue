<template>
  <PageTitle title="Notifications" />
  <template v-if="notificationsFeature.value">
    <RequireAuth2>
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
        <p
          v-if="
            !!state.selectedNotifications &&
            state.selectedNotifications.length > 0
          "
        >
          Are you sure you want to delete
          <span class="font-bold">
            "{{
              state.selectedNotifications.length > 1
                ? `${state.selectedNotifications.length} notifications`
                : state.selectedNotifications[0].title
            }}"
          </span>
          ?
        </p>

        <p>This action cannot be undone.</p>
      </ConfirmDialog>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div>
          <NotificationsSearchForm
            :search-options="state.searchOptions"
            @search="onSearch"
          />
        </div>

        <div class="col-span-1 lg:col-span-3">
          <NotificationsList
            :notifications="state.notifications"
            :is-loading="state.isLoading"
            :is-loading-more="state.isLoadingMore"
            @delete="onDelete"
            @dismiss="onDismiss"
            @undismiss="onUndismiss"
            @load-more="onLoadMore"
            @select="onSelection"
          />
        </div>
      </div>
    </RequireAuth2>
  </template>
  <NotFound v-else />
</template>

<script lang="ts" setup>
import {
  ApiList,
  ListNotificationsParamsDTO,
  ListNotificationsParamsSchema,
} from '@bottomtime/api';
import { NotificationsFeature } from '@bottomtime/common';

import { onMounted, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import NotFound from '../../components/common/not-found.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth2 from '../../components/common/require-auth2.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import NotificationsList from '../../components/users/notifications-list.vue';
import { NotificationWithSelection } from '../../components/users/types';
import { useFeatureToggle } from '../../featrues';
import { useOops } from '../../oops';
import { useCurrentUser, useNotifications, useToasts } from '../../store';
import NotificationsSearchForm from './notifications-search-form.vue';

interface NotificationsViewState {
  isDeleting: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  notifications: ApiList<NotificationWithSelection>;
  searchOptions: ListNotificationsParamsDTO;
  selectedNotifications?: NotificationWithSelection[];
  showDeleteDialog: boolean;
}

const client = useClient();
const oops = useOops();
const currentUser = useCurrentUser();
const notificationsFeature = useFeatureToggle(NotificationsFeature);
const notificationStore = useNotifications();
const route = useRoute();
const router = useRouter();
const toasts = useToasts();

function parseQueryString(): ListNotificationsParamsDTO {
  const parsed = ListNotificationsParamsSchema.safeParse(route.query);
  return parsed.success ? parsed.data : {};
}

const state = reactive<NotificationsViewState>({
  isDeleting: false,
  isLoading: true,
  isLoadingMore: false,
  notifications: {
    data: [],
    totalCount: 0,
  },
  searchOptions: parseQueryString(),
  showDeleteDialog: false,
});

async function refreshNotifications(): Promise<void> {
  state.isLoading = true;
  await oops(async () => {
    if (!currentUser.user) return;

    const results = await client.notifications.listNotifications(
      currentUser.user.username,
      state.searchOptions,
    );

    state.notifications.data = results.data.map((n) => ({
      ...n,
      selected: false,
    }));
    state.notifications.totalCount = results.totalCount;
  });
  state.isLoading = false;
}

async function onLoadMore(): Promise<void> {
  state.isLoadingMore = true;

  await oops(async () => {
    if (!currentUser.user) return;
    const results = await client.notifications.listNotifications(
      currentUser.user.username,
      {
        ...state.searchOptions,
        skip: state.notifications.data.length,
      },
    );

    state.notifications.data.push(
      ...results.data.map((n) => ({
        ...n,
        selected: false,
      })),
    );
    state.notifications.totalCount = results.totalCount;
  });

  state.isLoadingMore = false;
}

async function onSearch(options: ListNotificationsParamsDTO): Promise<void> {
  state.searchOptions = options;
  await router.push({ query: JSON.parse(JSON.stringify(options)) });
  await refreshNotifications();
}

function onDelete(
  notifications: NotificationWithSelection | NotificationWithSelection[],
): void {
  state.selectedNotifications = Array.isArray(notifications)
    ? notifications
    : [notifications];
  state.showDeleteDialog = true;
}

function onCancelDelete(): void {
  state.showDeleteDialog = false;
}

async function onConfirmDelete(): Promise<void> {
  state.isDeleting = true;

  await oops(async () => {
    if (!currentUser.user || !state.selectedNotifications) return;

    const ids = state.selectedNotifications.map((n) => n.id);
    await client.notifications.deleteNotifications(
      currentUser.user.username,
      ids,
    );

    const idsSet = new Set(ids);
    for (let i = state.notifications.data.length - 1; i >= 0; i--) {
      if (idsSet.has(state.notifications.data[i].id)) {
        state.notifications.data.splice(i, 1);
        state.notifications.totalCount--;
      }
    }
    notificationStore.removeNotifications(ids);

    toasts.toast({
      id: 'notification-deleted',
      message: 'Notification deleted.',
      type: ToastType.Success,
    });

    state.showDeleteDialog = false;
  });

  state.isDeleting = false;
}

async function onDismiss(
  notifications: NotificationWithSelection | NotificationWithSelection[],
): Promise<void> {
  if (!Array.isArray(notifications)) {
    notifications = [notifications];
  }

  await oops(async () => {
    if (!currentUser.user) return;
    const ids = notifications.map((n) => n.id);
    const idsSet = new Set(ids);

    await client.notifications.dismissNotifications(
      currentUser.user.username,
      ids,
    );

    for (let i = state.notifications.data.length - 1; i >= 0; i--) {
      if (idsSet.has(state.notifications.data[i].id)) {
        state.notifications.data[i].dismissed = true;
      }
    }

    for (const id of ids) {
      notificationStore.dismissNotification(id);
    }

    toasts.toast({
      id: 'notification-dismissed',
      message: 'Notification(s) marked as read.',
      type: ToastType.Success,
    });
  });
}

async function onUndismiss(
  notifications: NotificationWithSelection | NotificationWithSelection[],
): Promise<void> {
  if (!Array.isArray(notifications)) {
    notifications = [notifications];
  }

  await oops(async () => {
    if (!currentUser.user) return;
    const ids = notifications.map((n) => n.id);
    const idsSet = new Set(ids);

    await client.notifications.undismissNotifications(
      currentUser.user.username,
      ids,
    );

    for (let i = state.notifications.data.length - 1; i >= 0; i--) {
      if (idsSet.has(state.notifications.data[i].id)) {
        state.notifications.data[i].dismissed = false;
      }
    }

    toasts.toast({
      id: 'notification-undismissed',
      message: 'Notification(s) marked as unread.',
      type: ToastType.Success,
    });
  });
}

function onSelection(
  notifications: NotificationWithSelection | NotificationWithSelection[],
  selected: boolean,
): void {
  if (!Array.isArray(notifications)) {
    notifications = [notifications];
  }

  const ids = new Set(notifications.map((n) => n.id));
  state.notifications.data.forEach((notification) => {
    if (ids.has(notification.id)) {
      notification.selected = selected;
    }
  });
}

onMounted(async () => {
  if (notificationsFeature.value) {
    await refreshNotifications();
  }
});

watch(
  () => notificationsFeature.value,
  async (value) => {
    if (value) {
      await refreshNotifications();
    }
  },
);
</script>
