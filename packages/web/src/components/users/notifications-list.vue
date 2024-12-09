<template>
  <FormBox class="sticky top-16 flex gap-2 items-baseline">
    <p class="space-x-1 grow" data-testid="notification-counts">
      <span>Showing</span>
      <span class="font-bold font-mono">{{ notifications.data.length }}</span>
      <span>of</span>
      <span class="font-bold font-mono">{{ notifications.totalCount }}</span>
      <span>notifications.</span>
    </p>

    <fieldset>
      <FormButton
        size="sm"
        rounded="left"
        test-id="btn-select-all"
        @click="onSelectAll"
      >
        Select All
      </FormButton>
      <FormButton
        size="sm"
        rounded="right"
        test-id="btn-select-none"
        @click="onSelectNone"
      >
        Select None
      </FormButton>
    </fieldset>

    <fieldset :disabled="!bulkEnabled">
      <FormButton
        test-id="btn-bulk-dismiss"
        rounded="left"
        @click="onBulkDismiss"
      >
        <p class="space-x-2">
          <span>
            <i class="fa-solid fa-envelope-open"></i>
          </span>
          <span>Mark as read</span>
        </p>
      </FormButton>
      <FormButton
        test-id="btn-bulk-undismiss"
        :rounded="false"
        @click="onBulkUndismiss"
      >
        <p class="space-x-2">
          <span>
            <i class="fa-solid fa-envelope"></i>
          </span>
          <span>Mark as unread</span>
        </p>
      </FormButton>
      <FormButton
        test-id="btn-bulk-delete"
        rounded="right"
        type="danger"
        @click="onBulkDelete"
      >
        <p class="space-x-2">
          <span>
            <i class="fa-solid fa-trash"></i>
          </span>
          <span>Delete</span>
        </p>
      </FormButton>
    </fieldset>
  </FormBox>

  <div class="mx-2">
    <div v-if="isLoading" class="my-8 text-xl text-center">
      <LoadingSpinner message="Loading notifications..." />
    </div>
    <TransitionGroup tag="ul" name="list-fade" data-testid="notifications-list">
      <li
        v-if="notifications.data.length === 0"
        class="flex justify-center even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-8"
        data-testid="msg-no-notifications"
      >
        <p class="text-lg italic space-x-3">
          <span>👌</span>
          <span>You do not have any notifications to view.</span>
        </p>
      </li>

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

      <li
        v-if="notifications.data.length < notifications.totalCount"
        class="flex justify-center even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4 text-lg"
      >
        <LoadingSpinner
          v-if="isLoadingMore"
          message="Fetching more notifications..."
        />
        <a v-else data-testid="btn-load-more" @click="$emit('load-more')">
          Load more...
        </a>
      </li>
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
import { ApiList } from '@bottomtime/api';

import { computed } from 'vue';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import NotificationsListItem from './notifications-list-item.vue';
import { NotificationWithSelection } from './types';

interface NotificationsListProps {
  notifications: ApiList<NotificationWithSelection>;
  isLoading?: boolean;
  isLoadingMore?: boolean;
}

const props = withDefaults(defineProps<NotificationsListProps>(), {
  isLoading: false,
  isLoadingMore: false,
});
const emit = defineEmits<{
  (
    e: 'delete',
    notifications: NotificationWithSelection | NotificationWithSelection[],
  ): void;
  (
    e: 'dismiss',
    notifications: NotificationWithSelection | NotificationWithSelection[],
  ): void;
  (
    e: 'undismiss',
    notifications: NotificationWithSelection | NotificationWithSelection[],
  ): void;
  (
    e: 'select',
    notifications: NotificationWithSelection | NotificationWithSelection[],
    selected: boolean,
  ): void;
  (e: 'load-more'): void;
}>();

const bulkEnabled = computed(() => {
  return props.notifications.data.some((n) => n.selected);
});

function onToggleDismiss(notification: NotificationWithSelection) {
  if (notification.dismissed) {
    emit('undismiss', notification);
  } else {
    emit('dismiss', notification);
  }
}

function onSelectAll() {
  emit('select', props.notifications.data, true);
}

function onSelectNone() {
  emit('select', props.notifications.data, false);
}

function onBulkDismiss() {
  emit(
    'dismiss',
    props.notifications.data.filter((n) => n.selected),
  );
}

function onBulkUndismiss() {
  emit(
    'undismiss',
    props.notifications.data.filter((n) => n.selected),
  );
}

function onBulkDelete() {
  emit(
    'delete',
    props.notifications.data.filter((n) => n.selected),
  );
}
</script>
