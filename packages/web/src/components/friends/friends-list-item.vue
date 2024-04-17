<template>
  <li class="my-3 flex space-x-3">
    <div class="mx-2 my-4 min-w-[64px]">
      <UserAvatar
        :avatar="friend.avatar"
        :display-name="friend.name || friend.username"
        size="medium"
      />
    </div>

    <div class="grow flex flex-col space-y-2">
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

      <div class="flex space-x-3">
        <div class="grow flex flex-col space-y-2">
          <div class="flex flex-col space-y-2">
            <p class="flex space-x-3">
              <span class="font-bold min-w-24 text-right">Friends since:</span>
              <span>{{ dayjs(friend.friendsSince).fromNow() }}</span>
            </p>

            <p class="flex space-x-3">
              <span class="font-bold min-w-24 text-right">Member since:</span>
              <span>{{ dayjs(friend.memberSince).fromNow() }}</span>
            </p>

            <p v-if="friend.location" class="flex space-x-3">
              <span class="font-bold min-w-24 text-right">Location:</span>
              <span>{{ friend.location }}</span>
            </p>
          </div>
        </div>

        <div class="px-4">
          <FormButton type="danger" @click="onUnfriend">Unfriend</FormButton>
        </div>
      </div>
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

function onSelectFriend() {}

function onUnfriend() {}
</script>
