<template>
  <!-- Confirm Unfriend dialog -->
  <ConfirmDialog
    :visible="state.showConfirmUnfriend && !!state.currentFriend"
    title="Remove Friend?"
    confirm-text="Unfriend"
    icon="fa-regular fa-circle-question fa-2x"
    dangerous
    :is-loading="state.isUnfriending"
    @confirm="onConfirmUnfriend"
    @cancel="onCancelUnfriend"
  >
    <p>
      <span>Are you sure you want to remove </span>
      <span class="font-bold">
        {{ state.currentFriend?.name || `@${state.currentFriend?.username}` }}
      </span>
      <span> as a friend?</span>
    </p>

    <p>This action cannot be undone.</p>
  </ConfirmDialog>

  <!-- Cancel request dialog -->
  <ConfirmDialog
    :visible="state.showConfirmCancelRequest"
    title="Cancel Friend Request?"
    confirm-text="Cancel Request"
    icon="fa-regular fa-circle-question fa-2x"
    :is-loading="state.isCancellingRequest"
    @confirm="onConfirmCancelRequest"
    @cancel="onCancelCancelRequest"
  >
    <p>
      <span>Are you sure you want to cancel your friend request to </span>
      <span class="font-bold">
        {{
          state.currentRequest?.friend.name ||
          `@${state.currentRequest?.friend.username}`
        }}
      </span>
      <span>?</span>
    </p>
  </ConfirmDialog>

  <!-- User proflie drawer -->
  <ProfilePanel
    :profile="state.currentProfile ?? undefined"
    :is-loading="state.isLoadingProfile"
    :visible="state.showFriendProfile"
    @close="onCloseFriendProfile"
  />

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
          <a href="/friendRequests" class="no-style"> Friend Requests </a>
        </li>
      </ul>

      <div class="w-full flex flex-col space-y-3">
        <!-- Friends list-->
        <div
          v-if="state.isLoadingFriends"
          class="flex justify-center text-xl my-8"
        >
          <LoadingSpinner message="Fetching list of friends..." />
        </div>

        <FriendsList
          v-else
          :friends="state.friends"
          :is-loading-more="state.isLoadingMoreFriends"
          :sort-by="state.queryParams.sortBy"
          :sort-order="state.queryParams.sortOrder"
          @add-friend="onAddFriend"
          @change-sort-order="onChangeFriendsSortOrder"
          @load-more="onLoadMoreFriends"
          @select="onSelectFriend"
          @unfriend="onUnfriend"
        />

        <TextHeading class="pt-12">Pending Friend Requests</TextHeading>
        <p class="italic text-sm">
          These are friend requests that you have sent that have not yet been
          acknowledged.
        </p>
        <div
          v-if="state.isLoadingFriendRequests"
          class="flex justify-center text-xl my-8"
        >
          <LoadingSpinner message="Fetching friend requests..." />
        </div>

        <FriendRequestsList
          v-else
          :is-loading-more="state.isLoadingMoreRequests"
          :requests="state.friendRequests"
          @cancel="onCancelRequest"
          @dismiss="onDismissRequest"
          @load-more="onLoadMoreRequests"
          @select="onSelectFriendRequest"
        />
      </div>
    </div>
  </RequireAuth>
</template>

<script lang="ts" setup>
import {
  ApiList,
  FriendDTO,
  FriendRequestDTO,
  FriendRequestDirection,
  FriendsSortBy,
  ListFriendsParamsDTO,
  ListFriendsParamsSchema,
  ProfileDTO,
  SortOrder,
} from '@bottomtime/api';

import { onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import DrawerPanel from '../../components/common/drawer-panel.vue';
import LoadingSpinner from '../../components/common/loading-spinner.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth.vue';
import TextHeading from '../../components/common/text-heading.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import FriendRequestsList from '../../components/friends/friend-requests-list.vue';
import FriendsList from '../../components/friends/friends-list.vue';
import SearchFriendsForm from '../../components/friends/search-friends-form.vue';
import ProfilePanel from '../../components/users/profile-panel.vue';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';

interface FriendsViewState {
  currentFriend?: FriendDTO;
  currentRequest?: FriendRequestDTO;
  currentProfile?: ProfileDTO;
  friends: ApiList<FriendDTO>;
  friendRequests: ApiList<FriendRequestDTO>;
  isCancellingRequest: boolean;
  isLoadingFriends: boolean;
  isLoadingFriendRequests: boolean;
  isLoadingProfile: boolean;
  isLoadingMoreFriends: boolean;
  isLoadingMoreRequests: boolean;
  isUnfriending: boolean;
  queryParams: ListFriendsParamsDTO;
  showConfirmCancelRequest: boolean;
  showConfirmUnfriend: boolean;
  showFriendProfile: boolean;
  showSearchUsers: boolean;
}

// Dependencies
const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();
const router = useRouter();
const toasts = useToasts();

// State management
function parseQueryString(): ListFriendsParamsDTO {
  const query = ListFriendsParamsSchema.safeParse(route.path);
  if (query.success) return query.data;
  else return {};
}

const state = reactive<FriendsViewState>({
  friends: {
    data: [],
    totalCount: 0,
  },
  friendRequests: {
    data: [],
    totalCount: 0,
  },
  isCancellingRequest: false,
  isLoadingFriends: true,
  isLoadingFriendRequests: true,
  isLoadingProfile: false,
  isLoadingMoreFriends: false,
  isLoadingMoreRequests: false,
  isUnfriending: false,
  queryParams: parseQueryString(),
  showConfirmCancelRequest: false,
  showConfirmUnfriend: false,
  showFriendProfile: false,
  showSearchUsers: false,
});

// Loading data from server
async function refreshFriends(): Promise<void> {
  state.isLoadingFriends = true;
  await oops(async () => {
    if (!currentUser.user) return;

    state.friends = await client.friends.listFriends(
      currentUser.user.username,
      state.queryParams,
    );
  });
  state.isLoadingFriends = false;
}

async function refreshFriendRequests(): Promise<void> {
  state.isLoadingFriendRequests = true;
  await oops(async () => {
    if (!currentUser.user) return;

    state.friendRequests = await client.friends.listFriendRequests(
      currentUser.user.username,
      {
        direction: FriendRequestDirection.Outgoing,
        showAcknowledged: true,
        limit: 50,
      },
    );
  });
  state.isLoadingFriendRequests = false;
}

async function onLoadMoreFriends(): Promise<void> {
  state.isLoadingMoreFriends = true;

  await oops(async () => {
    if (!currentUser.user) return;

    const results = await client.friends.listFriends(
      currentUser.user.username,
      {
        ...state.queryParams,
        skip: state.friends.data.length,
      },
    );

    state.friends.data.push(...results.data);
    state.friends.totalCount = results.totalCount;
  });

  state.isLoadingMoreFriends = false;
}

async function onLoadMoreRequests(): Promise<void> {
  state.isLoadingMoreRequests = true;

  await oops(async () => {
    if (!currentUser.user) return;

    const results = await client.friends.listFriendRequests(
      currentUser.user.username,
      {
        direction: FriendRequestDirection.Outgoing,
        showAcknowledged: true,
        limit: 50,
        skip: state.friendRequests.data.length,
      },
    );

    state.friendRequests.data.push(...results.data);
    state.friendRequests.totalCount = results.totalCount;
  });

  state.isLoadingMoreRequests = false;
}

onMounted(async () => {
  await oops(async () => {
    await Promise.all([refreshFriends(), refreshFriendRequests()]);
  });
});

async function showProfile(username: string): Promise<void> {
  state.currentProfile = undefined;
  state.isLoadingProfile = true;
  state.showFriendProfile = true;

  await oops(
    async () => {
      state.currentProfile = await client.userProfiles.getProfile(username);
    },
    {
      [404]: () => {
        /* No-op */
      },
      default: () => {
        state.showFriendProfile = false;
        toasts.toast({
          id: 'get-profile-failed',
          message:
            "An error occurred while trying to retrieve the user's profile info. Please try again later.",
          type: ToastType.Error,
        });
      },
    },
  );

  state.isLoadingProfile = false;
}

// Event handlers
async function onChangeFriendsSortOrder(
  sortBy: FriendsSortBy,
  sortOrder: SortOrder,
): Promise<void> {
  await router.push({
    path: '/friends',
    query: {
      ...route.query,
      sortBy,
      sortOrder,
    },
  });
  state.queryParams.sortBy = sortBy;
  state.queryParams.sortOrder = sortOrder;
  await refreshFriends();
}

function onAddFriend() {
  state.showSearchUsers = true;
}

function onRequestSent(request: FriendRequestDTO) {
  state.friendRequests.data.unshift(request);
  state.friendRequests.totalCount++;
  state.showSearchUsers = false;
}

async function onSelectFriend(friend: FriendDTO): Promise<void> {
  state.currentFriend = friend;
  await showProfile(friend.username);
}

async function onSelectFriendRequest(request: FriendRequestDTO): Promise<void> {
  state.currentRequest = request;
  await showProfile(request.friend.username);
}

function onCloseFriendProfile() {
  state.showFriendProfile = false;
}

function onUnfriend(friend: FriendDTO) {
  state.currentFriend = friend;
  state.showConfirmUnfriend = true;
}

function onCancelUnfriend() {
  state.showConfirmUnfriend = false;
}

async function onConfirmUnfriend(): Promise<void> {
  state.isUnfriending = true;

  await oops(
    async () => {
      if (!state.currentFriend || !currentUser.user) return;

      await client.friends.unfriend(
        currentUser.user.username,
        state.currentFriend.username,
      );

      const index = state.friends.data.findIndex(
        (f) => f.userId === state.currentFriend?.userId,
      );
      if (index > -1) {
        state.friends.data.splice(index, 1);
        state.friends.totalCount--;
      }

      toasts.toast({
        id: 'unfriend-succeeded',
        message: `You have successfully unfriended ${
          state.currentFriend.name || `@${state.currentFriend.username}`
        }.`,
        type: ToastType.Success,
      });
    },
    {
      [404]: () => {
        const index = state.friends.data.findIndex(
          (f) => f.userId === state.currentFriend?.userId,
        );
        if (index > -1) {
          state.friends.data.splice(index, 1);
          state.friends.totalCount--;
        }
      },
    },
  );

  state.showConfirmUnfriend = false;
  state.isUnfriending = false;
}

function onCancelSearchFriends() {
  state.showSearchUsers = false;
}

function onCancelRequest(request: FriendRequestDTO) {
  state.currentRequest = request;
  state.showConfirmCancelRequest = true;
}

function onCancelCancelRequest() {
  state.showConfirmCancelRequest = false;
  state.currentRequest = undefined;
}

async function onConfirmCancelRequest(): Promise<void> {
  state.isCancellingRequest = true;

  await oops(
    async () => {
      if (!currentUser.user || !state.currentRequest) return;

      await client.friends.cancelFriendRequest(
        currentUser.user.username,
        state.currentRequest,
      );

      const index = state.friendRequests.data.findIndex(
        (r) => r.friendId === state.currentRequest?.friendId,
      );

      if (index > -1) {
        state.friendRequests.data.splice(index, 1);
        state.friendRequests.totalCount--;
      }

      toasts.toast({
        id: 'cancel-friend-request-succeeded',
        message: `You have successfully canceled your friend request to ${
          state.currentRequest.friend.name ||
          `@${state.currentRequest.friend.username}`
        }.`,
        type: ToastType.Success,
      });
    },
    {
      [404]: () => {
        toasts.toast({
          id: 'friend-request-not-found',
          message: `The friend request from ${
            state.currentRequest?.friend.name ||
            `@${state.currentRequest?.friend.username}`
          } no longer exists. Unable to cancel.`,
          type: ToastType.Warning,
        });

        const index = state.friendRequests.data.findIndex(
          (r) => r.friendId === state.currentRequest?.friend.userId,
        );
        if (index > -1) {
          state.friendRequests.data.splice(index, 1);
          state.friendRequests.totalCount--;
        }
      },
    },
  );

  state.showConfirmCancelRequest = false;
  state.isCancellingRequest = false;
  state.currentRequest = undefined;
}

async function onDismissRequest(dto: FriendRequestDTO): Promise<void> {
  await oops(
    async () => {
      if (!currentUser.user) return;

      await client.friends.cancelFriendRequest(currentUser.user.username, dto);

      const index = state.friendRequests.data.findIndex(
        (r) => r.friendId === dto.friend.userId,
      );

      if (index > -1) {
        state.friendRequests.data.splice(index, 1);
        state.friendRequests.totalCount--;
      }
    },
    {
      [404]: () => {
        const index = state.friendRequests.data.findIndex(
          (r) => r.friendId === dto.friend.userId,
        );

        if (index > -1) {
          state.friendRequests.data.splice(index, 1);
          state.friendRequests.totalCount--;
        }
      },
    },
  );
}
</script>
