<template>
  <ConfirmDialog
    :visible="showConfirmUnfriend && !!selectedFriend"
    title="Remove Friend?"
    confirm-text="Unfriend"
    dangerous
    @confirm="onConfirmUnfriend"
    @cancel="onCancelUnfriend"
  >
    <div class="flex space-x-4">
      <div>
        <i class="fa-regular fa-circle-question fa-2x"></i>
      </div>

      <div class="flex flex-col space-y-2">
        <p>
          <span>Are you sure you want to remove </span>
          <span class="font-bold">
            {{ selectedFriend?.name || `@${selectedFriend?.username}` }}
          </span>
          <span> as a friend?</span>
        </p>

        <p>This action cannot be undone.</p>
      </div>
    </div>
  </ConfirmDialog>

  <DrawerPanel
    :visible="showFriendPanel && !!selectedFriend"
    :title="selectedFriend?.name || `@${selectedFriend?.username}`"
    @close="onCloseFriendPanel"
  >
    Yo!
  </DrawerPanel>

  <PageTitle title="Friends" />

  <div class="flex flex-col md:flex-row gap-3 items-start">
    <ul
      class="w-full md:w-60 text-md md:text-lg *:p-3 hover:*:bg-blue-700 flex flex-col align-middle bg-gradient-to-b from-blue-700 to-blue-900 rounded-md text-grey-50"
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
      @add-friend="onAddFriend"
      @select-friend="onSelectFriend"
      @unfriend="onUnfriend"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  FriendDTO,
  ListFriendsParams,
  ListFriendsResponseDTO,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, ref, useSSRContext } from 'vue';

import { useClient } from '../api-client';
import DrawerPanel from '../components/common/drawer-panel.vue';
import PageTitle from '../components/common/page-title.vue';
import ConfirmDialog from '../components/dialog/confirm-dialog.vue';
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
const showConfirmUnfriend = ref(false);
const showFriendPanel = ref(false);
const selectedFriend = ref<FriendDTO | null>(null);

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

function onAddFriend() {
  console.log('Add friend');
}

function onSelectFriend(friend: FriendDTO) {
  selectedFriend.value = friend;
  showFriendPanel.value = true;
}

function onCloseFriendPanel() {
  showFriendPanel.value = false;
}

function onUnfriend(friend: FriendDTO) {
  selectedFriend.value = friend;
  showConfirmUnfriend.value = true;
}

async function onConfirmUnfriend(): Promise<void> {
  console.log('Unfriending', selectedFriend.value?.username);
  showConfirmUnfriend.value = false;
}

function onCancelUnfriend() {
  showConfirmUnfriend.value = false;
}
</script>
