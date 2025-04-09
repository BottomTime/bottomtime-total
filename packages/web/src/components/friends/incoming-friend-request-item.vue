<template>
  <li
    class="min-h-24 flex space-x-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-2 items-center"
  >
    <div class="min-w-[64px]">
      <UserAvatar :profile="request.friend" size="medium" />
    </div>

    <div class="grow flex flex-col space-y-1">
      <p
        class="flex flex-col md:flex-row space-x-0 md:space-x-3 items-baseline"
      >
        <FormButton
          size="2xl"
          type="link"
          :test-id="`select-request-${request.friendId}`"
          @click="$emit('select', request)"
        >
          {{ request.friend.name || `@${request.friend.username}` }}
        </FormButton>

        <span v-if="request.friend.name" class="text-lg font-bold">
          {{ `@${request.friend.username}` }}
        </span>
      </p>

      <div
        v-if="request.accepted === true"
        class="flex space-x-3 text-lg italic text-success"
      >
        <span>
          <i class="fa-regular fa-circle-check"></i>
        </span>
        <span>This friend request has been accepted.</span>
      </div>

      <div
        v-else-if="request.accepted === false"
        class="flex space-x-3 text-danger"
      >
        <div class="my-1">
          <i class="fa-regular fa-circle-xmark"></i>
        </div>
        <div>
          <p class="text-lg italic">This friend request has been declined.</p>
          <p v-if="request.reason" class="text-sm">"{{ request.reason }}"</p>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col lg:flex-row text-grey-400 space-x-0 lg:space-x-8"
      >
        <p class="flex space-x-2">
          <span class="font-bold min-w-20 text-right">Requested:</span>
          <span class="italic">{{ dayjs(request.created).format('lll') }}</span>
        </p>

        <p class="flex space-x-2">
          <span class="font-bold min-w-20 text-right">Expires:</span>
          <span class="italic">{{ dayjs(request.expires).format('lll') }}</span>
        </p>
      </div>
    </div>

    <div v-if="typeof request.accepted === 'boolean'">
      <FormButton
        :test-id="`dismiss-request-${request.friendId}`"
        @click="$emit('dismiss', request)"
      >
        Dismiss
      </FormButton>
    </div>

    <div v-else class="flex space-x-3 px-2">
      <FormButton
        :test-id="`accept-request-${request.friendId}`"
        @click="$emit('accept', request)"
      >
        Accept
      </FormButton>

      <FormButton
        :test-id="`decline-request-${request.friendId}`"
        type="danger"
        @click="$emit('decline', request)"
      >
        Decline
      </FormButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { FriendRequestDTO } from '@bottomtime/api';

import dayjs from 'src/dayjs';

import FormButton from '../common/form-button.vue';
import UserAvatar from '../users/user-avatar.vue';

interface IncomingFriendRequestItemProps {
  request: FriendRequestDTO;
}

defineProps<IncomingFriendRequestItemProps>();
defineEmits<{
  (e: 'accept', request: FriendRequestDTO): void;
  (e: 'decline', request: FriendRequestDTO, reason?: string): void;
  (e: 'dismiss', request: FriendRequestDTO): void;
  (e: 'select', request: FriendRequestDTO): void;
}>();
</script>
