<template>
  <IncomingFriendRequestItem
    v-if="request.direction === FriendRequestDirection.Incoming"
    :request="request"
    @accept="(request) => $emit('accept', request)"
    @decline="(request, reason) => $emit('decline', request, reason)"
    @select="(request) => $emit('select', request)"
  />

  <OutgoingFriendRequestItem
    v-if="request.direction === FriendRequestDirection.Outgoing"
    :request="request"
    @cancel="(request) => $emit('cancel', request)"
  />
</template>

<script lang="ts" setup>
import { FriendRequestDTO, FriendRequestDirection } from '@bottomtime/api';

import IncomingFriendRequestItem from './incoming-friend-request-item.vue';
import OutgoingFriendRequestItem from './outgoing-friend-request-item.vue';

interface FriendRequestsListItemProps {
  request: FriendRequestDTO;
}

defineProps<FriendRequestsListItemProps>();
defineEmits<{
  (e: 'accept', request: FriendRequestDTO): void;
  (e: 'cancel', request: FriendRequestDTO): void;
  (e: 'decline', request: FriendRequestDTO, reason?: string): void;
  (e: 'select', request: FriendRequestDTO): void;
}>();
</script>
