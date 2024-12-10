<template>
  <div class="relative">
    <button
      v-if="currentUser.user"
      v-click-outside="() => (showNotifications = false)"
      data-testid="btn-notifications-toggle"
      @click="() => (showNotifications = !showNotifications)"
    >
      <div class="relative">
        <i class="fa-solid fa-bell fa-lg"></i>
        <span
          v-show="notifications.data.length > 0"
          data-testid="notifications-count"
          class="rounded-full bg-danger-dark text-grey-50 px-1.5 text-xs absolute -top-1 left-[60%]"
        >
          {{
            notifications.totalCount.toLocaleString(['en-US', 'en-CA'], {
              useGrouping: true,
            })
          }}
        </span>
      </div>
    </button>
    <Transition name="nav-dropdown">
      <div
        v-if="showNotifications"
        class="absolute min-w-96 max-h-[460px] top-10 -right-16 bg-gradient-to-b from-blue-900 to-blue-950 rounded-b-md drop-shadow-lg z-[42] overflow-y-scroll"
      >
        <TransitionGroup name="list-fade" tag="ul">
          <li
            class="p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700 rounded-md flex gap-2 justify-center"
          >
            <RouterLink to="/notifications">
              Go to notifications...
            </RouterLink>
          </li>

          <li
            v-if="notifications.data.length === 0"
            data-testid="msg-no-new-notifications"
            class="p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700 rounded-md flex gap-2 justify-center"
          >
            <span>👌</span>
            <span class="italic">You have no new notifications!</span>
          </li>

          <NotificationsBellListItem
            v-for="notification in notifications.data"
            :key="notification.id"
            :notification="notification"
            @dismiss="onDismissNotification"
          />

          <li
            v-if="
              notifications.data.length > 0 &&
              notifications.data.length < notifications.totalCount
            "
            class="p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700 rounded-md flex gap-2 justify-center"
          >
            <LoadingSpinner
              v-if="isLoadingMore"
              message="Fetching more notifications..."
            />
            <a
              v-else
              data-testid="btn-load-more-notifications"
              @click.stop="onLoadMore"
            >
              Load more...
            </a>
          </li>
        </TransitionGroup>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { INotificationListener } from '@bottomtime/api';

import { ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { useClient } from '../../api-client';
import { useOops } from '../../oops';
import { useCurrentUser, useNotifications } from '../../store';
import LoadingSpinner from '../common/loading-spinner.vue';
import NotificationsBellListItem from './notifications-bell-list-item.vue';

const client = useClient();
const oops = useOops();
const currentUser = useCurrentUser();
const notifications = useNotifications();

const isLoadingMore = ref(false);
const showNotifications = ref(false);

const notificationListener = ref<INotificationListener | null>(null);

async function onDismissNotification(id: string): Promise<void> {
  await oops(async () => {
    if (currentUser.user) {
      await client.notifications.dismissNotifications(
        currentUser.user.username,
        id,
      );
    }
  });
  notifications.dismissNotification(id);
}

async function onLoadMore(): Promise<void> {
  isLoadingMore.value = true;

  await oops(async () => {
    if (currentUser.user) {
      const results = await client.notifications.listNotifications(
        currentUser.user.username,
        {
          showDismissed: false,
          skip: notifications.data.length,
          limit: 10,
        },
      );

      notifications.appendNotifications(results);
    }
  });

  isLoadingMore.value = false;
}

watch(
  () => currentUser.user,
  (user) => {
    if (user) {
      notificationListener.value = client.notifications.connect({
        init: (data) => {
          notifications.initNotifications(data);
        },
        newNotification: (data) => {
          notifications.addNotifications(data.data, data.totalCount);
        },
      });
    } else {
      notificationListener.value?.disconnect();
      notificationListener.value = null;
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.nav-dropdown-leave-active,
.nav-dropdown-enter-active {
  transition: all 0.2s ease-out;
}

.nav-dropdown-enter-from,
.nav-dropdown-leave-to {
  opacity: 0;
}
</style>
