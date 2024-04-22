<template>
  <!-- Confirm Unfriend dialog -->
  <ConfirmDialog
    :visible="state.showConfirmUnfriend && !!state.selectedFriend"
    title="Remove Friend?"
    confirm-text="Unfriend"
    dangerous
    :is-loading="state.isUnfriending"
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
            {{
              state.selectedFriend?.name || `@${state.selectedFriend?.username}`
            }}
          </span>
          <span> as a friend?</span>
        </p>

        <p>This action cannot be undone.</p>
      </div>
    </div>
  </ConfirmDialog>

  <ConfirmDialog
    :visible="state.showConfirmCancelRequest"
    title="Cancel Friend Request?"
    confirm-text="Cancel Request"
    :is-loading="state.isCancellingRequest"
    @confirm="onConfirmCancelRequest"
    @cancel="onCancelCancelRequest"
  >
    <div class="flex space-x-4">
      <div>
        <i class="fa-regular fa-circle-question fa-2x"></i>
      </div>

      <div class="flex flex-col space-y-2">
        <p>
          <span>Are you sure you want to cancel your friend request to </span>
          <span class="font-bold">
            {{
              state.selectedFriendRequest?.friend.name ||
              `@${state.selectedFriendRequest?.friend.username}`
            }}
          </span>
          <span>?</span>
        </p>
      </div>
    </div>
  </ConfirmDialog>

  <!-- User proflie drawer -->
  <DrawerPanel
    :visible="state.showFriendPanel && !!state.selectedFriend"
    :title="state.selectedFriend?.name || `@${state.selectedFriend?.username}`"
    @close="onCloseFriendPanel"
  >
    Yo!
  </DrawerPanel>

  <!-- Search users drawer -->
  <DrawerPanel
    :visible="state.showSearchUsers"
    title="Search For Friends"
    @close="onCancelSearchFriends"
  >
    <SearchFriendsForm @request-sent="onRequestSent" />
  </DrawerPanel>

  <PageTitle title="Friends" />

  <div class="flex flex-col md:flex-row gap-3 items-start">
    <!-- Nav menu -->
    <ul
      class="w-full md:w-60 text-md md:text-lg *:p-3 hover:*:bg-blue-700 flex flex-col align-middle bg-gradient-to-b from-blue-700 to-blue-900 rounded-md text-grey-50"
    >
      <li class="bg-blue-600 rounded-t-md">Friends</li>
      <li class="rounded-b-md">
        <a href="/friendRequests"> Friend Requests </a>
      </li>
    </ul>

    <!-- Friends list-->
    <div class="flex flex-col space-y-3 grow w-full">
      <FriendsList
        :friends="state.friends"
        :sort-by="state.queryParams.sortBy"
        :sort-order="state.queryParams.sortOrder"
        @add-friend="onAddFriend"
        @select-friend="onSelectFriend"
        @unfriend="onUnfriend"
      />

      <TextHeading>Pending Friend Requests</TextHeading>
      <p class="italic text-sm">
        These are friend requests that you have sent that have not yet been
        acknowledged.
      </p>
      <FriendRequestsList
        :requests="state.pendingRequests"
        @dismiss="onDismissRequest"
        @cancel="onCancelRequest"
      />

      <!-- <TextHeading>TODO: Blocked Users</TextHeading>
      <p class="italic text-sm">
        Can't believe I hadn't thought of this. Need to implement block lists.
      </p> -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  FriendDTO,
  FriendRequestDTO,
  FriendRequestDirection,
  ListFriendRequestsResponseDTO,
  ListFriendsParams,
  ListFriendsResponseDTO,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, useSSRContext } from 'vue';

import { useClient } from '../api-client';
import { ToastType } from '../common';
import DrawerPanel from '../components/common/drawer-panel.vue';
import PageTitle from '../components/common/page-title.vue';
import TextHeading from '../components/common/text-heading.vue';
import ConfirmDialog from '../components/dialog/confirm-dialog.vue';
import FriendRequestsList from '../components/friends/friend-requests-list.vue';
import FriendsList from '../components/friends/friends-list.vue';
import SearchFriendsForm from '../components/friends/search-friends-form.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useCurrentUser, useToasts } from '../store';

interface FriendsViewState {
  friends: ListFriendsResponseDTO;
  isCancellingRequest: boolean;
  isUnfriending: boolean;
  pendingRequests: ListFriendRequestsResponseDTO;
  queryParams: ListFriendsParams;
  selectedFriend: FriendDTO | null;
  selectedFriendRequest: FriendRequestDTO | null;
  showConfirmCancelRequest: boolean;
  showConfirmUnfriend: boolean;
  showFriendPanel: boolean;
  showSearchUsers: boolean;
}

function parseQueryString(): ListFriendsParams {
  return {};
}

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();
const toasts = useToasts();

const state = reactive<FriendsViewState>({
  friends: initialState?.friends ?? { friends: [], totalCount: 0 },
  isCancellingRequest: false,
  isUnfriending: false,
  pendingRequests: initialState?.friendRequests ?? {
    friendRequests: [],
    totalCount: 0,
  },
  queryParams: parseQueryString(),
  selectedFriend: null,
  selectedFriendRequest: null,
  showConfirmCancelRequest: false,
  showConfirmUnfriend: false,
  showFriendPanel: false,
  showSearchUsers: false,
});

onServerPrefetch(async () => {
  await oops(async () => {
    if (!currentUser.user) return;

    const [friendsResult, pendingRequests] = await Promise.all([
      client.friends.listFriends(currentUser.user.username, state.queryParams),
      client.friends.listFriendRequests(currentUser.user.username, {
        direction: FriendRequestDirection.Outgoing,
        showAcknowledged: true,
        limit: 50,
      }),
    ]);

    state.friends = {
      friends: friendsResult.friends.map((f) => f.toJSON()),
      totalCount: friendsResult.totalCount,
    };
    state.pendingRequests = {
      friendRequests: pendingRequests.friendRequests.map((r) => r.toJSON()),
      totalCount: pendingRequests.totalCount,
    };

    if (ctx) {
      ctx.friends = state.friends;
      ctx.friendRequests = state.pendingRequests;
    }
  });
});

function onAddFriend() {
  state.showSearchUsers = true;
}

function onRequestSent(request: FriendRequestDTO) {
  state.pendingRequests.friendRequests.unshift(request);
  state.pendingRequests.totalCount++;
  state.showSearchUsers = false;
}

function onSelectFriend(friend: FriendDTO) {
  state.selectedFriend = friend;
  state.showFriendPanel = true;
}

function onCloseFriendPanel() {
  state.showFriendPanel = false;
}

function onUnfriend(friend: FriendDTO) {
  state.selectedFriend = friend;
  state.showConfirmUnfriend = true;
}

async function onConfirmUnfriend(): Promise<void> {
  state.isUnfriending = true;

  await oops(async () => {
    const friend = state.selectedFriend;
    if (!friend || !currentUser.user) return;

    await client.friends.unfriend(currentUser.user.username, friend.username);

    const index = state.friends.friends.findIndex((f) => f.id === friend.id);

    if (index > -1) {
      state.friends.friends.splice(index, 1);
    }

    toasts.toast({
      id: 'unfriend-succeeded',
      message: `You have successfully unfriended ${
        friend.name || `@${friend.username}`
      }.`,
      type: ToastType.Success,
    });
  });

  state.showConfirmUnfriend = false;
  state.isUnfriending = false;
}

function onCancelUnfriend() {
  state.showConfirmUnfriend = false;
}

function onCancelSearchFriends() {
  state.showSearchUsers = false;
}

function onCancelRequest(request: FriendRequestDTO) {
  state.selectedFriendRequest = request;
  state.showConfirmCancelRequest = true;
}

function onCancelCancelRequest() {
  state.showConfirmCancelRequest = false;
  state.selectedFriendRequest = null;
}

async function onConfirmCancelRequest(): Promise<void> {
  state.isCancellingRequest = true;

  await oops(async () => {
    if (!currentUser.user || !state.selectedFriendRequest) return;

    const request = client.friends.wrapFriendRequestDTO(
      currentUser.user.username,
      state.selectedFriendRequest,
    );
    await request.cancel();

    const index = state.pendingRequests.friendRequests.findIndex(
      (r) => r.friendId === state.selectedFriendRequest?.friendId,
    );

    if (index > -1) {
      state.pendingRequests.friendRequests.splice(index, 1);
      state.pendingRequests.totalCount--;
    }

    toasts.toast({
      id: 'cancel-friend-request-succeeded',
      message: `You have successfully canceled your friend request to ${
        state.selectedFriendRequest.friend.name ||
        `@${state.selectedFriendRequest.friend.username}`
      }.`,
      type: ToastType.Success,
    });
  });

  state.showConfirmCancelRequest = false;
  state.isCancellingRequest = false;
  state.selectedFriendRequest = null;
}

async function onDismissRequest(dto: FriendRequestDTO): Promise<void> {
  await oops(async () => {
    if (!currentUser.user) return;

    const request = client.friends.wrapFriendRequestDTO(
      currentUser.user.username,
      dto,
    );

    await request.cancel();

    const index = state.pendingRequests.friendRequests.findIndex(
      (r) => r.friendId === request.friend.id,
    );

    if (index > -1) {
      state.pendingRequests.friendRequests.splice(index, 1);
      state.pendingRequests.totalCount--;
    }
  });
}
</script>
