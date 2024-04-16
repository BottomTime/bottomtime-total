<template>
  <PageTitle title="Friends" />
  <div>Search for new friend</div>
  <TabsPanel :tabs="tabs" :active-tab="activeTab" @tab-changed="onTabChanged">
    <FriendsList
      v-if="activeTab === FriendsPageTabs.Friends"
      :friends="friends"
    />
    <FriendRequestsList
      v-if="activeTab === FriendsPageTabs.Requests"
      :requests="friendRequests"
    />
  </TabsPanel>
</template>

<script lang="ts" setup>
import {
  ListFriendRequestsResponseDTO,
  ListFriendsResponseDTO,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, ref, useSSRContext } from 'vue';

import { useClient } from '../api-client';
import { TabInfo } from '../common';
import PageTitle from '../components/common/page-title.vue';
import TabsPanel from '../components/common/tabs-panel.vue';
import FriendRequestsList from '../components/friends/friend-requests-list.vue';
import FriendsList from '../components/friends/friends-list.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useCurrentUser } from '../store';

enum FriendsPageTabs {
  Friends = 'friends',
  Requests = 'requests',
}

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();

const tabs: TabInfo[] = [
  { key: FriendsPageTabs.Friends, label: 'Friends' },
  { key: FriendsPageTabs.Requests, label: 'Friend Requests' },
];

const activeTab = ref(FriendsPageTabs.Friends);
const friends = reactive<ListFriendsResponseDTO>(
  initialState?.friends ? initialState.friends : { friends: [], totalCount: 0 },
);
const friendRequests = reactive<ListFriendRequestsResponseDTO>(
  initialState?.friendRequests
    ? initialState.friendRequests
    : { friendRequests: [], totalCount: 0 },
);

function onTabChanged(key: string) {
  activeTab.value = key as FriendsPageTabs;
}

onServerPrefetch(async () => {
  await oops(async () => {
    if (!currentUser.user) return;
    const [friendsResult, friendRequestsResults] = await Promise.all([
      client.friends.listFriends(currentUser.user.username),
      client.friends.listFriendRequests(currentUser.user.username),
    ]);

    if (ctx) {
      ctx.friends = {
        friends: friendsResult.friends.map((friend) => friend.toJSON()),
        totalCount: friendsResult.totalCount,
      };
      ctx.friendRequests = {
        friendRequests: friendRequestsResults.friendRequests.map((friend) =>
          friend.toJSON(),
        ),
        totalCount: friendRequestsResults.totalCount,
      };
    }
  });
});
</script>
