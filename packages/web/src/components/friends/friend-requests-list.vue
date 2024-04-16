<template>
  <div class="flex flex-col space-y-3 grow">
    <FormBox class="flex justify-between">
      <p>
        <span>Showing </span>
        <span class="font-bold">{{ requests.friendRequests.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ requests.totalCount }}</span>
        <span> friend requests</span>
      </p>
      <div class="flex items-baseline">(sort order goes here)</div>
    </FormBox>

    <TextHeading>Incoming Requests</TextHeading>
    <ul>
      <FriendRequestsListItem
        v-for="request in requests.friendRequests.filter(
          (r) => r.direction === FriendRequestDirection.Incoming,
        )"
        :key="request.friendId"
        :request="request"
      />
    </ul>

    <TextHeading>Pending Requests</TextHeading>
    <ul>
      <FriendRequestsListItem
        v-for="request in requests.friendRequests.filter(
          (r) => r.direction === FriendRequestDirection.Outgoing,
        )"
        :key="request.friendId"
        :request="request"
      />
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {
  FriendRequestDirection,
  ListFriendRequestsResponseDTO,
} from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import TextHeading from '../common/text-heading.vue';
import FriendRequestsListItem from './friend-requests-list-item.vue';

interface FriendRequestsListProps {
  requests: ListFriendRequestsResponseDTO;
}

defineProps<FriendRequestsListProps>();
</script>
