<template>
  <div class="relative">
    <button
      v-if="currentUser.user"
      v-click-outside="() => (showNotifications = false)"
      @click="() => (showNotifications = !showNotifications)"
    >
      <div class="relative">
        <i class="fa-solid fa-bell fa-lg"></i>
        <span
          v-show="notifications.data.length > 0"
          class="rounded-full bg-danger-dark text-grey-50 px-1.5 text-xs absolute -top-1 left-2.5"
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
        class="absolute min-w-96 max-h-96 top-10 -right-16 bg-gradient-to-b from-blue-900 to-blue-950 rounded-b-md drop-shadow-lg z-[42] overflow-y-scroll"
      >
        <ul>
          <li
            v-if="notifications.data.length === 0"
            class="p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700 rounded-md flex gap-2 justify-center"
          >
            <span>👌</span>
            <span class="italic">You have no new notifications!</span>
          </li>
          <li
            v-for="notification in notifications.data"
            v-else
            :key="notification.id"
            class="p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700 rounded-md flex gap-2"
            @click.stop=""
          >
            <span class="text-2xl">{{ notification.icon }}</span>
            <div class="space-y-0.5 grow">
              <p class="font-bold capitalize">{{ notification.title }}</p>
              <p class="italic">{{ notification.message }}</p>
              <p class="flex gap-2">
                <span
                  v-for="(action, i) in notification.callsToAction"
                  :key="i"
                >
                  <RouterLink
                    v-if="action.type === NotificationCallToActionType.Link"
                    :to="action.url"
                  >
                    {{ action.caption }}
                  </RouterLink>
                  <a
                    v-else-if="
                      action.type === NotificationCallToActionType.LinkToNewTab
                    "
                    :href="action.url"
                    target="_blank"
                  >
                    {{ action.caption }}
                  </a>
                </span>
              </p>
            </div>
            <div>
              <button
                @click.prevent="() => onDismissNotification(notification.id)"
              >
                <i class="fa-solid fa-circle-xmark hover:text-secondary"></i>
              </button>
            </div>
          </li>

          <li
            v-if="isLoadingMore"
            class="p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700 rounded-md flex gap-2 justify-center"
          >
            <LoadingSpinner message="Fetching more notifications..." />
          </li>
          <li
            v-else-if="
              notifications.data.length > 0 &&
              notifications.data.length < notifications.totalCount
            "
            class="p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700 rounded-md flex gap-2 justify-center"
          >
            <a @click.stop="onLoadMore">Load more...</a>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import {
  INotificationListener,
  NotificationCallToActionType,
} from '@bottomtime/api';

import { ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { useClient } from '../../api-client';
import { useOops } from '../../oops';
import { useCurrentUser, useNotifications } from '../../store';
import LoadingSpinner from '../common/loading-spinner.vue';

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
      await client.notifications.dismissNotification(
        currentUser.user.username,
        id,
      );
    }
  });
  notifications.dismissNotification(id);
  showNotifications.value = false;
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
          // notifications.initNotifications(data);
        },
        newNotification: (data) => {
          notifications.appendNotifications(data);
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
