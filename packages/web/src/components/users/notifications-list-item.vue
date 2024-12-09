<template>
  <li
    class="flex items-center gap-4 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-4"
  >
    <div class="mt-2.5">
      <FormCheckbox
        v-model="selected"
        :control-id="`select-${notification.id}`"
        :test-id="`select-${notification.id}`"
      >
        <span class="sr-only">Select "{{ notification.title }}"</span>
      </FormCheckbox>
    </div>

    <figure class="mt-1">
      <span class="text-2xl">{{ notification.icon }}</span>
    </figure>

    <div class="grow space-y-1">
      <div class="flex flex-col lg:flex-row gap-2 items-start lg:items-center">
        <p
          v-if="!notification.dismissed"
          class="bg-success font-mono text-grey-800 px-1 text-xs rounded-full font-bold"
        >
          New
        </p>
        <div class="flex flex-col lg:flex-row gap-2 items-baseline">
          <p class="text-2xl font-bold capitalize">{{ notification.title }}</p>
          <p class="italic text-sm">{{ activeDate }}</p>
        </div>
      </div>
      <p>{{ notification.message }}</p>
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

    <div class="flex justify-end text-sm min-w-16">
      <FormButton rounded="left" @click="$emit('toggle-dismiss', notification)">
        <span class="sr-only"
          >Mark "{{ notification.title }}" as
          {{ notification.dismissed ? 'unread' : 'read' }}</span
        >
        <span v-if="notification.dismissed">
          <i class="fa-solid fa-envelope"></i>
        </span>
        <span v-else>
          <i class="fa-solid fa-envelope-open"></i>
        </span>
      </FormButton>
      <FormButton
        type="danger"
        rounded="right"
        @click="$emit('delete', notification)"
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
import { NotificationCallToActionType } from '@bottomtime/api';

import dayjs from 'dayjs';
import { computed, ref, watch } from 'vue';

import FormButton from '../common/form-button.vue';
import FormCheckbox from '../common/form-checkbox.vue';
import { NotificationWithSelection } from './types';

interface NotificationsListItemProps {
  notification: NotificationWithSelection;
}

const props = defineProps<NotificationsListItemProps>();
const emit = defineEmits<{
  (e: 'delete', notification: NotificationWithSelection): void;
  (e: 'toggle-dismiss', notification: NotificationWithSelection): void;
  (
    e: 'select',
    notification: NotificationWithSelection,
    selected: boolean,
  ): void;
}>();

const selected = ref(props.notification.selected ?? false);
const activeDate = computed<string | undefined>(() => {
  return (
    props.notification.active && dayjs(props.notification.active).fromNow()
  );
});

watch(selected, (value) => {
  emit('select', props.notification, value);
});

watch(
  () => props.notification.selected,
  (value) => {
    selected.value = value;
  },
);
</script>
