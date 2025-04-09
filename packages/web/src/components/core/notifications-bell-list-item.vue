<template>
  <li
    :key="notification.id"
    class="p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700 rounded-md flex gap-2"
    @click.stop=""
  >
    <span class="text-2xl">{{ notification.icon }}</span>
    <div class="space-y-0.5 grow">
      <p class="font-bold capitalize">{{ notification.title }}</p>
      <p v-if="activeDate" class="text-xs">{{ activeDate }}</p>
      <p class="italic">{{ notification.message }}</p>
      <p v-if="notification.callsToAction?.length" class="flex gap-2">
        <span v-for="(action, i) in notification.callsToAction" :key="i">
          <!-- Router link for internal links -->
          <RouterLink
            v-if="action.url.startsWith('/')"
            :to="action.url"
            :target="getLinkTarget(action)"
          >
            {{ action.caption }}
          </RouterLink>

          <!-- Regular <a> tag for external links -->
          <a v-else :href="action.url" :target="getLinkTarget(action)">
            {{ action.caption }}
          </a>
        </span>
      </p>
    </div>
    <div>
      <button
        :data-testid="`btn-dismiss-notification-${notification.id}`"
        @click.stop="$emit('dismiss', notification.id)"
      >
        <span class="sr-only">Dismiss "{{ notification.title }}"</span>
        <span>
          <i class="fa-solid fa-circle-xmark hover:text-secondary"></i>
        </span>
      </button>
    </div>
  </li>
</template>

<script lang="ts" setup>
import {
  NotificationCallToAction,
  NotificationCallToActionType,
  NotificationDTO,
} from '@bottomtime/api';

import dayjs from 'src/dayjs';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

interface NotificationsBellListItemProps {
  notification: NotificationDTO;
}

const props = defineProps<NotificationsBellListItemProps>();
defineEmits<{
  (e: 'dismiss', notificationId: string): void;
}>();

const activeDate = computed(() =>
  props.notification.active
    ? dayjs(props.notification.active).fromNow()
    : undefined,
);

function getLinkTarget(action: NotificationCallToAction): string {
  return action.type === NotificationCallToActionType.Link ? '_self' : '_blank';
}
</script>
