<template>
  <li
    class="min-h-24 flex space-x-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-2 items-center"
  >
    <div class="min-w-[64px]">
      <UserAvatar :profile="friend" size="medium" />
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

      <div class="grid grid-cols-2 lg:grid-cols-4">
        <div class="text-center">
          <label class="font-bold">Friends since</label>
          <p class="text-sm">
            {{ dayjs(friend.friendsSince).fromNow() }}
          </p>
        </div>

        <div class="text-center">
          <label class="font-bold">Member since</label>
          <p class="text-sm">
            {{ dayjs(friend.memberSince).fromNow() }}
          </p>
        </div>

        <div class="text-center">
          <label class="font-bold">Location</label>
          <p class="text-sm">
            {{ friend.location || 'Unspecified' }}
          </p>
        </div>

        <div class="text-center">
          <label class="font-bold">Pages</label>
          <p class="text-sm space-x-2">
            <RouterLink class="space-x-1" :to="`/profile/${friend.username}`">
              <span>View profile</span>
            </RouterLink>
            <RouterLink
              v-if="friend.logBookSharing !== LogBookSharing.Private"
              class="space-x-1"
              :to="`/logbook/${friend.username}`"
            >
              <span>View logbook</span>
            </RouterLink>
          </p>
        </div>
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
import { FriendDTO, LogBookSharing } from '@bottomtime/api';

import dayjs from 'src/dayjs';
import { RouterLink } from 'vue-router';

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
