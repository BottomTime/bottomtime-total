<template>
  <FormBox class="sticky top-16">
    <p class="space-x-1">
      <span>Showing</span>
      <span class="font-bold font-mono">{{ notifications.data.length }}</span>
      <span>of</span>
      <span class="font-bold font-mono">{{ notifications.totalCount }}</span>
      <span>notifications.</span>
    </p>
  </FormBox>
  <div class="mx-2">
    <div v-if="isLoading" class="my-8 text-xl text-center">
      <LoadingSpinner message="Loading notifications..." />
    </div>
    <TransitionGroup tag="ul" name="list-fade">
      <NotificationsListItem
        v-for="notification in notifications.data"
        :key="notification.id"
        :notification="notification"
        @delete="(notification) => $emit('delete', notification)"
        @toggle-dismiss="onToggleDismiss"
        @select="
          (notification, selected) => $emit('select', notification, selected)
        "
      />
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
import { ApiList, NotificationDTO } from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import NotificationsListItem from './notifications-list-item.vue';

interface NotificationsListProps {
  notifications: ApiList<NotificationDTO & { selected?: boolean }>;
  isLoading?: boolean;
}

withDefaults(defineProps<NotificationsListProps>(), {
  isLoading: false,
});
const emit = defineEmits<{
  (e: 'delete', notifications: NotificationDTO | NotificationDTO[]): void;
  (e: 'dismiss', notifications: NotificationDTO | NotificationDTO[]): void;
  (e: 'undismiss', notifications: NotificationDTO | NotificationDTO[]): void;
  (e: 'select', notification: NotificationDTO, selected: boolean): void;
}>();

function onToggleDismiss(notification: NotificationDTO) {
  if (notification.dismissed) {
    emit('undismiss', notification);
  } else {
    emit('dismiss', notification);
  }
}
</script>
