<template>
  <li
    class="flex space-x-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-2 items-center"
  >
    <div class="min-w-[64px]">
      <UserAvatar
        :avatar="request.friend.avatar"
        :display-name="request.friend.name || request.friend.username"
        size="medium"
      />
    </div>

    <div class="grow flex flex-col space-y-1">
      <p class="flex space-x-3 items-baseline">
        <span class="text-2xl">
          {{ request.friend.name || `@${request.friend.username}` }}
        </span>
        <span v-if="request.friend.name" class="text-lg font-bold">
          {{ `@${request.friend.username}` }}
        </span>
      </p>

      <div class="flex text-grey-400 space-x-8">
        <p class="flex space-x-2">
          <span class="font-bold">Requested:</span>
          <span class="italic">{{ dayjs(request.created).format('lll') }}</span>
        </p>

        <p class="flex space-x-2">
          <span class="font-bold">Expires:</span>
          <span class="italic">{{ dayjs(request.expires).format('lll') }}</span>
        </p>
      </div>
    </div>

    <div class="flex space-x-3 px-2">
      <FormButton @click="$emit('accept', request)">Accept</FormButton>
      <FormButton type="danger" @click="$emit('decline', request)">
        Decline
      </FormButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { FriendRequestDTO } from '@bottomtime/api';

import dayjs from 'dayjs';

import FormButton from '../common/form-button.vue';
import UserAvatar from '../users/user-avatar.vue';

interface IncomingFriendRequestItemProps {
  request: FriendRequestDTO;
}

defineProps<IncomingFriendRequestItemProps>();
defineEmits<{
  (e: 'accept', request: FriendRequestDTO): void;
  (e: 'decline', request: FriendRequestDTO): void;
  (e: 'select', request: FriendRequestDTO): void;
}>();
</script>
