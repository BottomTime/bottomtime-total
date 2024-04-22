<template>
  <PageTitle title="Friend Requests" />

  <div class="flex flex-col md:flex-row gap-3 items-start">
    <!-- Nav menu -->
    <ul
      class="w-full md:w-60 text-md md:text-lg *:p-3 hover:*:bg-blue-700 flex flex-col align-middle bg-gradient-to-b from-blue-700 to-blue-900 rounded-md text-grey-50"
    >
      <li class="rounded-t-md">
        <a href="/friends"> Friends </a>
      </li>
      <li class="bg-blue-600 rounded-b-md">Friend Requests</li>
    </ul>

    <FriendRequestsList
      :requests="friendRequests"
      @accept="onAcceptFriendRequest"
      @decline="onDeclineFriendRequest"
      @select="onSelectFriendRequest"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  FriendRequestDTO,
  FriendRequestDirection,
  ListFriendRequestsResponseDTO,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, useSSRContext } from 'vue';

import { useClient } from '../api-client';
import { ToastType } from '../common';
import PageTitle from '../components/common/page-title.vue';
import FriendRequestsList from '../components/friends/friend-requests-list.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useCurrentUser, useToasts } from '../store';

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();
const toasts = useToasts();

const friendRequests = reactive<ListFriendRequestsResponseDTO>(
  initialState?.friendRequests
    ? initialState.friendRequests
    : { friendRequests: [], totalCount: 0 },
);

onServerPrefetch(async () => {
  await oops(async () => {
    if (!currentUser.user) return;

    const friendRequestsResults = await client.friends.listFriendRequests(
      currentUser.user.username,
      {
        direction: FriendRequestDirection.Incoming,
        showAcknowledged: false,
      },
    );

    friendRequests.friendRequests = friendRequestsResults.friendRequests.map(
      (friend) => friend.toJSON(),
    );
    friendRequests.totalCount = friendRequestsResults.totalCount;

    if (ctx) {
      ctx.friendRequests = friendRequests;
    }
  });
});

async function onAcceptFriendRequest(dto: FriendRequestDTO) {
  await oops(async () => {
    if (!currentUser.user) return;

    const request = client.friends.wrapFriendRequestDTO(
      currentUser.user.username,
      dto,
    );

    await request.accept();

    const index = friendRequests.friendRequests.findIndex(
      (r) => r.friendId === request.friend.id,
    );
    if (index > -1) {
      friendRequests.friendRequests.splice(index, 1);
    }

    toasts.toast({
      id: 'friend-request-accepted',
      message: `You are now friends with ${
        request.friend.name || request.friend.username
      }.`,
      type: ToastType.Success,
    });
  });
}

async function onDeclineFriendRequest(dto: FriendRequestDTO, reason?: string) {
  await oops(async () => {
    if (!currentUser.user) return;

    const request = client.friends.wrapFriendRequestDTO(
      currentUser.user.username,
      dto,
    );

    await request.decline(reason);

    const index = friendRequests.friendRequests.findIndex(
      (r) => r.friendId === request.friend.id,
    );
    if (index > -1) {
      friendRequests.friendRequests.splice(index, 1);
    }

    toasts.toast({
      id: 'friend-request-declined',
      message: `You have successfully declined friend request from ${
        request.friend.name || request.friend.username
      }.`,
      type: ToastType.Success,
    });
  });
}

function onSelectFriendRequest(request: FriendRequestDTO) {}
</script>
