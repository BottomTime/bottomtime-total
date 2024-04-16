<template>
  <div>Friend requests list {{ requests.totalCount }}</div>
  <ul>
    <FriendRequestsListItem
      v-for="request in requests.friendRequests"
      :key="request.friendId"
      :request="request"
    />
  </ul>
</template>

<script lang="ts" setup>
import { ListFriendRequestsResponseDTO } from '@bottomtime/api';

import FriendRequestsListItem from './friend-requests-list-item.vue';

interface FriendRequestsListProps {
  requests: ListFriendRequestsResponseDTO;
}

defineProps<FriendRequestsListProps>();
</script>
