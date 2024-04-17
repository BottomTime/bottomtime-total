<template>
  <DrawerPanel
    :title="
      selectedRequest?.friend.username
        ? `@${selectedRequest.friend.username}`
        : ''
    "
    :visible="!!selectedRequest"
    @close="onDrawerClose"
  >
    <div>Put some content here.</div>
  </DrawerPanel>

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
        @select="onRequestSelected"
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
        @select="onRequestSelected"
      />
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {
  FriendRequestDTO,
  FriendRequestDirection,
  ListFriendRequestsResponseDTO,
} from '@bottomtime/api';

import { ref } from 'vue';

import DrawerPanel from '../common/drawer-panel.vue';
import FormBox from '../common/form-box.vue';
import TextHeading from '../common/text-heading.vue';
import FriendRequestsListItem from './friend-requests-list-item.vue';

interface FriendRequestsListProps {
  requests: ListFriendRequestsResponseDTO;
}

defineProps<FriendRequestsListProps>();

const selectedRequest = ref<FriendRequestDTO | null>(null);

function onRequestSelected(request: FriendRequestDTO) {
  selectedRequest.value = request;
}

function onDrawerClose() {
  selectedRequest.value = null;
}
</script>
