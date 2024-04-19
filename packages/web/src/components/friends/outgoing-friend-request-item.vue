<template>
  <li
    class="flex space-x-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-2"
  >
    <div class="min-w-[64px]">
      <UserAvatar
        :avatar="request.friend.avatar"
        :display-name="request.friend.name || request.friend.username"
        size="medium"
      />
    </div>

    <div class="grow flex flex-col space-y-2">
      <p class="flex space-x-3 items-baseline">
        <span class="font-bold text-2xl">
          {{ request.friend.name || `@${request.friend.username}` }}
        </span>
        <span v-if="request.friend.name" class="text-lg">
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

      <div v-else class="flex text-grey-400 italic space-x-6 justify-between">
        <p>
          <span class="font-bold">Requested:</span>
          <span>{{ dayjs(request.created).format() }}</span>
        </p>

        <p>
          <span class="font-bold">Expires:</span>
          <span>{{ dayjs(request.expires).format() }}</span>
        </p>
      </div>
    </div>

    <div class="min-w-16 h-full">
      <div
        v-if="typeof request.accepted === 'boolean'"
        class="text-right my-6 mx-2"
      >
        <CloseButton label="Dismiss" />
      </div>

      <div v-else class="texst-right my-6 mx-2">
        <FormButton> Cancel </FormButton>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { FriendRequestDTO } from '@bottomtime/api';

import dayjs from 'dayjs';

import CloseButton from '../common/close-button.vue';
import FormButton from '../common/form-button.vue';
import UserAvatar from '../users/user-avatar.vue';

interface OutgoingFriendRequestItemProps {
  request: FriendRequestDTO;
}

defineProps<OutgoingFriendRequestItemProps>();
</script>
