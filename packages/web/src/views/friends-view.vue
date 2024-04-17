<template>
  <PageTitle title="Friends" />

  <div class="flex gap-3 items-start">
    <ul
      class="min-w-60 text-lg *:p-3 hover:*:bg-blue-700 flex flex-col align-middle bg-gradient-to-b from-blue-700 to-blue-900 rounded-md text-grey-50"
    >
      <li class="bg-blue-600 rounded-t-md">Friends</li>
      <li class="rounded-b-md">
        <a href="/friendRequests"> Friend Requests </a>
      </li>
    </ul>

    <FriendsList
      :friends="friends"
      :sort-by="queryParams.sortBy"
      :sort-order="queryParams.sortOrder"
    />
  </div>
</template>

<script lang="ts" setup>
import { ListFriendsParams, ListFriendsResponseDTO } from '@bottomtime/api';

import { onServerPrefetch, reactive, useSSRContext } from 'vue';

import { useClient } from '../api-client';
import PageTitle from '../components/common/page-title.vue';
import FriendsList from '../components/friends/friends-list.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

function parseQueryString(): ListFriendsParams {
  return {};
}

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();

const friends = reactive<ListFriendsResponseDTO>(
  initialState?.friends ? initialState.friends : { friends: [], totalCount: 0 },
);

const queryParams = reactive<ListFriendsParams>(parseQueryString());

onServerPrefetch(async () => {
  await oops(async () => {
    if (!currentUser.user) return;
    const friendsResult = await client.friends.listFriends(
      currentUser.user.username,
      queryParams,
    );

    friends.friends = friendsResult.friends.map((friend) => friend.toJSON());
    friends.totalCount = friendsResult.totalCount;

    if (ctx) {
      ctx.friends = friends;
    }
  });
});
</script>
