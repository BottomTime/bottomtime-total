<template>
  <div v-if="request.direction === FriendRequestDirection.Incoming">
    Incoming
  </div>

  <OutgoingFriendRequestItem
    v-if="request.direction === FriendRequestDirection.Outgoing"
    :request="request"
    @cancel="(request) => $emit('cancel-request', request)"
  />
</template>

<script lang="ts" setup>
import { FriendRequestDTO, FriendRequestDirection } from '@bottomtime/api';

import OutgoingFriendRequestItem from './outgoing-friend-request-item.vue';

interface FriendRequestsListItemProps {
  request: FriendRequestDTO;
}

defineProps<FriendRequestsListItemProps>();
defineEmits<{
  (e: 'cancel-request', request: FriendRequestDTO): void;
}>();
</script>
