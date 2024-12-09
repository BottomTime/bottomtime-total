<template>
  <li
    class="flex items-center gap-4 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
  >
    <div class="mt-2.5">
      <FormCheckbox>
        <span class="sr-only">Select "{{ notification.title }}"</span>
      </FormCheckbox>
    </div>

    <figure class="mt-1">
      <span class="text-2xl">{{ notification.icon }}</span>
    </figure>

    <div class="grow space-y-1">
      <div class="flex gap-2 items-center">
        <p class="bg-secondary text-grey-800 px-1 text-xs rounded-full">New</p>
        <div class="flex gap-2 items-baseline">
          <p class="text-2xl font-bold capitalize">{{ notification.title }}</p>
          <p class="italic">{{ activeDate }}</p>
        </div>
      </div>
      <p class="italic">{{ notification.message }}</p>
      <p>
        {{ JSON.stringify(notification) }}
      </p>
      <div class="flex gap-2">
        <a
          v-for="(action, index) in notification.callsToAction"
          :key="index"
          class="text-lg"
          :href="action.url"
          :target="
            action.type === NotificationCallToActionType.Link
              ? '_self'
              : '_blank'
          "
        >
          {{ action.caption }}
        </a>
      </div>
    </div>

    <div class="flex">
      <FormButton rounded="left">
        <span class="sr-only">Mark "{{ notification.title }}" as read</span>
        <span>
          <i class="fa-solid fa-check"></i>
        </span>
      </FormButton>
      <FormButton
        type="danger"
        rounded="right"
        @click="() => $emit('delete', notification)"
      >
        <span class="sr-only">Delete "{{ notification.title }}"</span>
        <span>
          <i class="fa-solid fa-trash"></i>
        </span>
      </FormButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { NotificationCallToActionType, NotificationDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed } from 'vue';

import FormButton from '../common/form-button.vue';
import FormCheckbox from '../common/form-checkbox.vue';

interface NotificationsListItemProps {
  notification: NotificationDTO;
}

const props = defineProps<NotificationsListItemProps>();
defineEmits<{
  (e: 'delete', notification: NotificationDTO): void;
}>();

const activeDate = computed<string | undefined>(() => {
  return (
    props.notification.active && dayjs(props.notification.active).fromNow()
  );
});
</script>
