<template>
  <li class="my-3 flex space-x-3 items-center">
    <div class="mx-2 min-w-[64px]">
      <UserAvatar
        :avatar="friend.avatar"
        :display-name="friend.name || friend.username"
        size="medium"
      />
    </div>

    <div class="grow flex flex-col">
      <p class="flex space-x-3 items-baseline">
        <FormButton
          type="link"
          size="2xl"
          class="text-2xl"
          @click="onSelectFriend"
        >
          {{ friend.name || `@${friend.username}` }}
        </FormButton>
        <span v-if="friend.name" class="font-bold">
          {{ `@${friend.username}` }}
        </span>
      </p>

      <div class="flex flex-col xl:flex-row flex-nowrap xl:space-x-3">
        <p class="flex space-x-3">
          <span class="font-bold min-w-24 text-right">Friends since:</span>
          <span class="min-w-36">
            {{ dayjs(friend.friendsSince).fromNow() }}
          </span>
        </p>

        <p class="flex space-x-3">
          <span class="font-bold min-w-24 text-right">Member since:</span>
          <span class="min-w-36">
            {{ dayjs(friend.memberSince).fromNow() }}
          </span>
        </p>

        <p v-if="friend.location" class="flex space-x-3">
          <span class="font-bold min-w-24 text-right">Location:</span>
          <span class="min-w-36">
            {{ friend.location }}
          </span>
        </p>
      </div>
    </div>

    <div class="px-4">
      <FormButton type="danger" @click="onUnfriend">Unfriend</FormButton>
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

const props = defineProps<FriendsListItemProps>();
const emit = defineEmits<{
  (e: 'select', friend: FriendDTO): void;
  (e: 'unfriend', friend: FriendDTO): void;
}>();

function onSelectFriend() {
  emit('select', props.friend);
}

function onUnfriend() {
  emit('unfriend', props.friend);
}
</script>
