<template>
  <PageTitle title="Friend Requests" />

  <div class="flex gap-3 items-start">
    <ul
      class="min-w-60 text-lg *:p-3 hover:*:bg-blue-700 flex flex-col align-middle bg-gradient-to-b from-blue-700 to-blue-900 rounded-md text-grey-50"
    >
      <li class="rounded-t-md">
        <a href="/friends"> Friends </a>
      </li>
      <li class="bg-blue-600 rounded-b-md">Friend Requests</li>
    </ul>

    <FriendRequestsList :requests="friendRequests" />
  </div>
</template>

<script lang="ts" setup>
import {
  FriendRequestDirection,
  ListFriendRequestsResponseDTO,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, useSSRContext } from 'vue';

import { useClient } from '../api-client';
import PageTitle from '../components/common/page-title.vue';
import FriendRequestsList from '../components/friends/friend-requests-list.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();

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
</script>
