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
    <ViewProfile v-if="state.friendProfile" :profile="state.friendProfile" />

    <div v-else class="text-lg italic flex space-x-3 justify-center my-20">
      <span>
        <i class="fa-solid fa-spinner fa-spin"></i>
      </span>
      <span>Loading profile...</span>
    </div>
  </DrawerPanel>

  <!-- Search users drawer -->
  <DrawerPanel
    :visible="state.showSearchUsers"
    title="Search For Friends"
    @close="onCancelSearchFriends"
  >
    <SearchFriendsForm
      @request-sent="onRequestSent"
      @close="onCancelSearchFriends"
    />
  </DrawerPanel>

  <PageTitle title="Friends" />

  <RequireAuth>
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

      <div class="w-full flex flex-col space-y-3">
        <!-- Friends list-->
        <FriendsList
          :friends="state.friends"
          :sort-by="state.queryParams.sortBy"
          :sort-order="state.queryParams.sortOrder"
          @add-friend="onAddFriend"
          @change-sort-order="onChangeFriendsSortOrder"
          @select="onSelectFriend"
          @unfriend="onUnfriend"
        />

        <TextHeading class="pt-12">Pending Friend Requests</TextHeading>
        <p class="italic text-sm">
          These are friend requests that you have sent that have not yet been
          acknowledged.
        </p>
        <FriendRequestsList
          :requests="state.pendingRequests"
          @dismiss="onDismissRequest"
          @cancel="onCancelRequest"
        />
      </div>
    </div>
  </RequireAuth>
</template>

<script lang="ts" setup>
import {
  FriendDTO,
  FriendRequestDTO,
  FriendRequestDirection,
  FriendsSortBy,
  ListFriendRequestsResponseDTO,
  ListFriendsParams,
  ListFriendsParamsSchema,
  ListFriendsResponseDTO,
  ProfileDTO,
  SortOrder,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, useSSRContext } from 'vue';

import { useClient } from '../api-client';
import { ToastType } from '../common';
import DrawerPanel from '../components/common/drawer-panel.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import TextHeading from '../components/common/text-heading.vue';
import ConfirmDialog from '../components/dialog/confirm-dialog.vue';
import FriendRequestsList from '../components/friends/friend-requests-list.vue';
import FriendsList from '../components/friends/friends-list.vue';
import SearchFriendsForm from '../components/friends/search-friends-form.vue';
import ViewProfile from '../components/users/view-profile.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useCurrentUser, useToasts } from '../store';

interface FriendsViewState {
  friendProfile: ProfileDTO | null;
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

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const location = useLocation();
const oops = useOops();
const toasts = useToasts();

function parseQueryString(): ListFriendsParams {
  const search = new URLSearchParams(location.search);

  let sortBy: FriendsSortBy | undefined;
  let sortOrder: SortOrder | undefined;

  if (search.has('sortBy')) {
    const parsed = ListFriendsParamsSchema.shape.sortBy.safeParse(
      search.get('sortBy'),
    );
    sortBy = parsed.success ? parsed.data : undefined;
  }

  if (search.has('sortOrder')) {
    const parsed = ListFriendsParamsSchema.shape.sortOrder.safeParse(
      search.get('sortOrder'),
    );
    sortOrder = parsed.success ? parsed.data : undefined;
  }

  return { sortBy, sortOrder };
}

const state = reactive<FriendsViewState>({
  friendProfile: null,
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

async function refreshFriends(): Promise<void> {
  await oops(async () => {
    if (!currentUser.user) return;

    const results = await client.friends.listFriends(
      currentUser.user.username,
      state.queryParams,
    );

    state.friends = {
      friends: results.friends.map((f) => f.toJSON()),
      totalCount: results.totalCount,
    };
  });
}

async function refreshFriendRequests(): Promise<void> {
  await oops(async () => {
    if (!currentUser.user) return;

    const results = await client.friends.listFriendRequests(
      currentUser.user.username,
      {
        direction: FriendRequestDirection.Outgoing,
        showAcknowledged: true,
        limit: 50,
      },
    );

    state.pendingRequests = {
      friendRequests: results.friendRequests.map((r) => r.toJSON()),
      totalCount: results.totalCount,
    };
  });
}

onServerPrefetch(async () => {
  await Promise.all([refreshFriends(), refreshFriendRequests()]);
  if (ctx) {
    ctx.friends = state.friends;
    ctx.friendRequests = state.pendingRequests;
  }
});

async function onChangeFriendsSortOrder(
  sortBy: FriendsSortBy,
  sortOrder: SortOrder,
): Promise<void> {
  state.queryParams.sortBy = sortBy;
  state.queryParams.sortOrder = sortOrder;
  location.assign(`/friends?sortBy=${sortBy}&sortOrder=${sortOrder}`);
}

function onAddFriend() {
  state.showSearchUsers = true;
}

function onRequestSent(request: FriendRequestDTO) {
  state.pendingRequests.friendRequests.unshift(request);
  state.pendingRequests.totalCount++;
  state.showSearchUsers = false;
}

async function onSelectFriend(friend: FriendDTO): Promise<void> {
  state.selectedFriend = friend;
  state.friendProfile = null;
  state.showFriendPanel = true;

  await oops(async () => {
    state.friendProfile = await client.users.getProfile(friend.username);
  });
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
