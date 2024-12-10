import { ApiList, NotificationDTO } from '@bottomtime/api';

import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

export const useNotifications = defineStore('notifications', () => {
  const notificationData = reactive<ApiList<NotificationDTO>>({
    data: [],
    totalCount: 0,
  });
  const data = computed<NotificationDTO[]>(() => notificationData.data);
  const totalCount = computed<number>(() => notificationData.totalCount);

  function dismissNotification(id: string) {
    const index = notificationData.data.findIndex((n) => n.id === id);
    if (index > -1) {
      notificationData.data.splice(index, 1);
      notificationData.totalCount--;
    }
  }

  function addNotifications(
    notifications: NotificationDTO | NotificationDTO[],
    totalCount?: number,
  ) {
    if (Array.isArray(notifications)) {
      notificationData.data.splice(0, 0, ...notifications);
    } else {
      notificationData.data.splice(0, 0, notifications);
    }

    if (typeof totalCount === 'number') {
      notificationData.totalCount = totalCount;
    }
  }

  function initNotifications(notifications: ApiList<NotificationDTO>) {
    notificationData.data = notifications.data;
    notificationData.totalCount = notifications.totalCount;
  }

  function appendNotifications(notifications: ApiList<NotificationDTO>) {
    notificationData.data.push(...notifications.data);
    notificationData.totalCount = notifications.totalCount;
  }

  function removeNotifications(notificationIds: string[]) {
    const ids = new Set(notificationIds);
    notificationData.totalCount -= ids.size;
    for (let i = notificationData.data.length - 1; i >= 0; i--) {
      if (ids.has(notificationData.data[i].id)) {
        notificationData.data.splice(i, 1);
      }
    }
  }

  return {
    addNotifications,
    appendNotifications,
    data,
    dismissNotification,
    initNotifications,
    removeNotifications,
    totalCount,
  };
});
