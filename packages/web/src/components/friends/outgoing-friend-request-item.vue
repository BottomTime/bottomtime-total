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
          :test-id="`select-request-${request.friendId}`"
          type="link"
          size="2xl"
          @click="$emit('select', request)"
        >
          {{ request.friend.name || `@${request.friend.username}` }}
        </FormButton>

        <span v-if="request.friend.name" class="text-lg font-bold">
          {{ `@${request.friend.username}` }}
        </span>
      </p>

      <p
        v-if="request.accepted === true"
        class="text-success flex space-x-1 items-baseline"
      >
        <span>
          <i class="fa-regular fa-circle-check"></i>
        </span>
        <span class="font-bold">Request accepted!</span>
      </p>

      <div v-else-if="request.accepted === false" class="text-danger">
        <p class="flex space-x-1 items-baseline">
          <span>
            <i class="fa-regular fa-circle-xmark"></i>
          </span>
          <span class="font-bold">Request declined.</span>
        </p>
        <p v-if="request.reason" class="italic">"{{ request.reason }}"</p>
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

    <div class="min-w-16 h-full">
      <div
        v-if="typeof request.accepted === 'boolean'"
        class="text-right my-6 mx-2"
      >
        <FormButton
          :test-id="`dismiss-request-${request.friendId}`"
          @click="$emit('dismiss', request)"
        >
          Dismiss
        </FormButton>
      </div>

      <div v-else class="texst-right my-6 mx-2">
        <FormButton
          :test-id="`cancel-request-${request.friendId}`"
          @click="$emit('cancel', request)"
        >
          Cancel
        </FormButton>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { FriendRequestDTO } from '@bottomtime/api';

import dayjs from 'src/dayjs';

import FormButton from '../common/form-button.vue';
import UserAvatar from '../users/user-avatar.vue';

interface OutgoingFriendRequestItemProps {
  request: FriendRequestDTO;
}

defineProps<OutgoingFriendRequestItemProps>();
defineEmits<{
  (e: 'cancel', request: FriendRequestDTO): void;
  (e: 'dismiss', request: FriendRequestDTO): void;
  (e: 'select', request: FriendRequestDTO): void;
}>();
</script>
