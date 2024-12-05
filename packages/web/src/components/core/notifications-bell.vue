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
            notifications.data.length.toLocaleString(['en-US', 'en-CA'], {
              useGrouping: true,
            })
          }}
        </span>
      </div>
    </button>
    <Transition name="nav-dropdown">
      <div
        v-if="showNotifications && notifications.data.length > 0"
        class="absolute min-w-96 top-10 -right-16 bg-gradient-to-b from-blue-900 to-blue-950 rounded-b-md drop-shadow-lg z-[42]"
      >
        <ul>
          <li
            v-for="notification in notifications.data"
            :key="notification.id"
            class="p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700 rounded-md flex gap-2"
            @click.stop=""
          >
            <span class="text-2xl">{{ notification.icon }}</span>
            <div class="space-y-0.5 grow">
              <p class="font-bold">{{ notification.title }}</p>
              <p>{{ notification.message }}</p>
              <p>
                <a href="" class="text-secondary">Click here</a>
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
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { INotificationListener } from '@bottomtime/api';

import { ref, watch } from 'vue';

import { useClient } from '../../api-client';
import { useOops } from '../../oops';
import { useCurrentUser, useNotifications } from '../../store';

const client = useClient();
const oops = useOops();
const currentUser = useCurrentUser();
const notifications = useNotifications();

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

watch(
  () => currentUser.user,
  (user) => {
    if (user) {
      notificationListener.value = client.notifications.connect({
        init: (data) => {
          notifications.initNotifications(data);
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
