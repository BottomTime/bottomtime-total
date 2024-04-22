<template>
  <div class="w-full flex flex-col space-y-3">
    <FormBox>
      <p>
        <span>Showing </span>
        <span class="font-bold">{{ requests.friendRequests.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ requests.totalCount }}</span>
        <span> results</span>
      </p>
    </FormBox>

    <ul>
      <FriendRequestsListItem
        v-for="request in requests.friendRequests"
        :key="request.friendId"
        :request="request"
        @cancel="(request) => $emit('cancel', request)"
        @accept="(request) => $emit('accept', request)"
        @decline="(request, reason) => $emit('decline', request, reason)"
        @select="(request) => $emit('select', request)"
      />
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {
  FriendRequestDTO,
  ListFriendRequestsResponseDTO,
} from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import FriendRequestsListItem from './friend-requests-list-item.vue';

interface FriendRequestsListProps {
  requests: ListFriendRequestsResponseDTO;
}

defineProps<FriendRequestsListProps>();
defineEmits<{
  (e: 'cancel', request: FriendRequestDTO): void;
  (e: 'accept', request: FriendRequestDTO): void;
  (e: 'decline', request: FriendRequestDTO, reason?: string): void;
  (e: 'select', request: FriendRequestDTO): void;
}>();
</script>
