<template>
  <li
    class="min-h-24 flex space-x-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-2 items-center"
  >
    <div class="min-w-[64px]">
      <UserAvatar
        :avatar="friend.avatar"
        :display-name="friend.name || friend.username"
        size="medium"
      />
    </div>

    <div class="grow flex flex-col space-y-1">
      <p
        class="flex flex-col md:flex-row space-x-0 md:space-x-3 items-baseline"
      >
        <FormButton
          type="link"
          size="2xl"
          class="text-2xl"
          :test-id="`select-friend-${friend.username}`"
          @click="$emit('select', friend)"
        >
          {{ friend.name || `@${friend.username}` }}
        </FormButton>

        <span v-if="friend.name" class="font-bold">
          {{ `@${friend.username}` }}
        </span>
      </p>

      <div class="flex flex-col xl:flex-row space-x-0 xl:space-x-3">
        <p class="flex space-x-2">
          <span class="font-bold min-w-20 text-right">Friends for:</span>
          <span class="w-36">
            {{ dayjs(friend.friendsSince).fromNow(true) }}
          </span>
        </p>

        <p class="flex space-x-2">
          <span class="font-bold min-w-20 text-right">Member for:</span>
          <span class="w-36">
            {{ dayjs(friend.memberSince).fromNow(true) }}
          </span>
        </p>

        <p v-if="friend.location" class="flex space-x-2">
          <span class="font-bold min-w-20 text-right">Location:</span>
          <span class="w-36">
            {{ friend.location }}
          </span>
        </p>
      </div>
    </div>

    <div>
      <FormButton
        type="danger"
        :test-id="`unfriend-${friend.username}`"
        @click="$emit('unfriend', friend)"
      >
        Unfriend
      </FormButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { FriendDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import 'dayjs/plugin/relativeTime';

import FormButton from '../common/form-button.vue';
import UserAvatar from '../users/user-avatar.vue';

interface FriendsListItemProps {
  friend: FriendDTO;
}

defineProps<FriendsListItemProps>();
defineEmits<{
  (e: 'select', friend: FriendDTO): void;
  (e: 'unfriend', friend: FriendDTO): void;
}>();
</script>
