<template>
  <li
    class="flex space-x-3 items-center even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-sm p-2"
  >
    <div class="w-[32px]">
      <UserAvatar
        :avatar="user.avatar ?? undefined"
        :display-name="user.name || user.username"
        size="small"
      />
    </div>

    <div class="flex flex-col space-y-1 grow">
      <p class="flex space-x-3 items-baseline">
        <span class="text-xl font-bold">
          {{ user.name || `@${user.username}` }}
        </span>

        <span v-if="user.name" class="text-lg">
          {{ `@${user.username}` }}
        </span>
      </p>

      <p v-if="user.location" class="flex space-x-2">
        <span class="text-danger">
          <i class="fa-solid fa-location-dot"></i>
        </span>
        <span>{{ user.location }}</span>
      </p>

      <p class="text-sm italic flex space-x-3 text-grey-400">
        <span class="font-bold">Joined:</span>
        <span>{{ dayjs(user.memberSince).fromNow() }}</span>
      </p>
    </div>

    <div>
      <FormButton
        :test-id="`send-request-${user.username}`"
        @click="$emit('send-request', user)"
      >
        Send Friend Request
      </FormButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { SuccinctProfileDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import 'dayjs/plugin/relativeTime';

import FormButton from '../common/form-button.vue';
import UserAvatar from '../users/user-avatar.vue';

interface SearchFriendsListItemProps {
  user: SuccinctProfileDTO;
}

defineProps<SearchFriendsListItemProps>();
defineEmits<{
  (e: 'send-request', user: SuccinctProfileDTO): void;
}>();
</script>
