<template>
  <div class="grow flex flex-col space-y-3">
    <FormBox>
      <p data-testid="request-counts">
        <span>Showing </span>
        <span class="font-bold">{{ requests.friendRequests.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ requests.totalCount }}</span>
        <span> results</span>
      </p>
    </FormBox>

    <ul
      v-if="requests.friendRequests.length"
      data-testid="friend-requests-list"
    >
      <FriendRequestsListItem
        v-for="request in requests.friendRequests"
        :key="request.friendId"
        :request="request"
        @cancel="(request) => $emit('cancel', request)"
        @dismiss="(request) => $emit('dismiss', request)"
        @accept="(request) => $emit('accept', request)"
        @decline="(request, reason) => $emit('decline', request, reason)"
        @select="(request) => $emit('select', request)"
      />

      <li
        v-if="requests.friendRequests.length < requests.totalCount"
        class="min-h-24 flex items-center justify-center"
      >
        <p
          v-if="isLoadingMore"
          data-testid="friend-requests-loading-more"
          class="flex space-x-3 text-lg italic"
        >
          <span>
            <i class="fa-solid fa-spinner fa-spin"></i>
          </span>
          <span>Loading more requests...</span>
        </p>

        <FormButton
          v-else
          type="link"
          size="lg"
          test-id="friend-requests-load-more"
          @click="$emit('load-more')"
        >
          Load more requests...
        </FormButton>
      </li>
    </ul>

    <p
      v-else
      data-testid="friend-requests-no-results"
      class="py-6 text-lg italic flex space-x-3 justify-center"
    >
      <span>
        <i class="fa-solid fa-circle-info"></i>
      </span>
      <span>No requests to display.</span>
    </p>
  </div>
</template>

<script lang="ts" setup>
import {
  FriendRequestDTO,
  ListFriendRequestsResponseDTO,
} from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FriendRequestsListItem from './friend-requests-list-item.vue';

interface FriendRequestsListProps {
  isLoadingMore?: boolean;
  requests: ListFriendRequestsResponseDTO;
}

withDefaults(defineProps<FriendRequestsListProps>(), {
  isLoadingMore: false,
});
defineEmits<{
  (e: 'accept', request: FriendRequestDTO): void;
  (e: 'cancel', request: FriendRequestDTO): void;
  (e: 'decline', request: FriendRequestDTO, reason?: string): void;
  (e: 'dismiss', request: FriendRequestDTO): void;
  (e: 'load-more'): void;
  (e: 'select', request: FriendRequestDTO): void;
}>();
</script>
