<template>
  <!-- Confirm Unfriend dialog -->
  <ConfirmDialog
    :visible="state.showConfirmUnfriend && !!friends.currentFriend"
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
              friends.currentFriend?.name ||
              `@${friends.currentFriend?.username}`
            }}
          </span>
          <span> as a friend?</span>
        </p>

        <p>This action cannot be undone.</p>
      </div>
    </div>
  </ConfirmDialog>

  <!-- Cancel request dialog -->
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
              friends.currentRequest?.friend.name ||
              `@${friends.currentRequest?.friend.username}`
            }}
          </span>
          <span>?</span>
        </p>
      </div>
    </div>
  </ConfirmDialog>

  <!-- User proflie drawer -->
  <ProfilePanel
    :profile="profiles.currentProfile ?? undefined"
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
          <a href="/friendRequests"> Friend Requests </a>
        </li>
      </ul>

      <div class="w-full flex flex-col space-y-3">
        <!-- Friends list-->
        <FriendsList
          :friends="friends.friends"
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
        <FriendRequestsList
          :is-loading-more="state.isLoadingMoreRequests"
          :requests="friends.requests"
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
  FriendDTO,
  FriendRequestDTO,
  FriendRequestDirection,
  FriendsSortBy,
  ListFriendsParams,
  ListFriendsParamsSchema,
  SortOrder,
} from '@bottomtime/api';

import { URLSearchParams } from 'url';
import { onServerPrefetch, reactive } from 'vue';

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
import ProfilePanel from '../components/users/profile-panel.vue';
import { useLocation } from '../location';
import { useOops } from '../oops';
import { useCurrentUser, useFriends, useProfiles, useToasts } from '../store';

interface FriendsViewState {
  isCancellingRequest: boolean;
  isLoadingProfile: boolean;
  isLoadingMoreFriends: boolean;
  isLoadingMoreRequests: boolean;
  isUnfriending: boolean;
  queryParams: ListFriendsParams;
  showConfirmCancelRequest: boolean;
  showConfirmUnfriend: boolean;
  showFriendProfile: boolean;
  showSearchUsers: boolean;
}

// Dependencies
const client = useClient();
const currentUser = useCurrentUser();
const friends = useFriends();
const location = useLocation();
const oops = useOops();
const profiles = useProfiles();
const toasts = useToasts();

// State management
function parseQueryString(): ListFriendsParams {
  const search = new URLSearchParams(location.search);

  let sortBy: FriendsSortBy | undefined;
  let sortOrder: SortOrder | undefined;
  let limit: number = 50;

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

  if (search.has('limit')) {
    const parsed = ListFriendsParamsSchema.shape.limit.safeParse(
      search.get('limit'),
    );
    if (parsed.success && parsed.data) limit = parsed.data;
  }

  return { sortBy, sortOrder, limit };
}

const state = reactive<FriendsViewState>({
  isCancellingRequest: false,
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
  await oops(async () => {
    if (!currentUser.user) return;

    const results = await client.friends.listFriends(
      currentUser.user.username,
      state.queryParams,
    );

    friends.friends = {
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

    friends.requests = {
      friendRequests: results.friendRequests.map((r) => r.toJSON()),
      totalCount: results.totalCount,
    };
  });
}

async function onLoadMoreFriends(): Promise<void> {
  state.isLoadingMoreFriends = true;

  await oops(async () => {
    if (!currentUser.user) return;

    const results = await client.friends.listFriends(
      currentUser.user.username,
      {
        ...state.queryParams,
        skip: friends.friends.friends.length,
      },
    );

    friends.friends.friends.push(...results.friends.map((f) => f.toJSON()));
    friends.friends.totalCount = results.totalCount;
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
        skip: friends.requests.friendRequests.length,
      },
    );

    friends.requests.friendRequests.push(
      ...results.friendRequests.map((r) => r.toJSON()),
    );
    friends.requests.totalCount = results.totalCount;
  });

  state.isLoadingMoreRequests = false;
}

onServerPrefetch(async () => {
  await oops(async () => {
    await Promise.all([refreshFriends(), refreshFriendRequests()]);
  });
});

async function showProfile(username: string): Promise<void> {
  profiles.currentProfile = null;
  state.isLoadingProfile = true;
  state.showFriendProfile = true;

  await oops(
    async () => {
      profiles.currentProfile = await client.users.getProfile(username);
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
  location.assign(
    `/friends?sortBy=${sortBy}&sortOrder=${sortOrder}&limit=${state.queryParams.limit}`,
  );
}

function onAddFriend() {
  state.showSearchUsers = true;
}

function onRequestSent(request: FriendRequestDTO) {
  friends.requests.friendRequests.unshift(request);
  friends.requests.totalCount++;
  state.showSearchUsers = false;
}

async function onSelectFriend(friend: FriendDTO): Promise<void> {
  friends.currentFriend = friend;
  await showProfile(friend.username);
}

async function onSelectFriendRequest(request: FriendRequestDTO): Promise<void> {
  friends.currentRequest = request;
  await showProfile(request.friend.username);
}

function onCloseFriendProfile() {
  state.showFriendProfile = false;
}

function onUnfriend(friend: FriendDTO) {
  friends.currentFriend = friend;
  state.showConfirmUnfriend = true;
}

function onCancelUnfriend() {
  state.showConfirmUnfriend = false;
}

async function onConfirmUnfriend(): Promise<void> {
  state.isUnfriending = true;

  await oops(
    async () => {
      const dto = friends.currentFriend;
      if (!dto || !currentUser.user) return;

      const friend = client.friends.wrapFriendDTO(
        currentUser.user.username,
        dto,
      );
      await friend.unfriend();

      const index = friends.friends.friends.findIndex(
        (f) => f.id === friend.id,
      );
      if (index > -1) {
        friends.friends.friends.splice(index, 1);
        friends.friends.totalCount--;
      }

      toasts.toast({
        id: 'unfriend-succeeded',
        message: `You have successfully unfriended ${
          friend.name || `@${friend.username}`
        }.`,
        type: ToastType.Success,
      });
    },
    {
      [404]: () => {
        const index = friends.friends.friends.findIndex(
          (f) => f.id === friends.currentFriend?.id,
        );
        if (index > -1) {
          friends.friends.friends.splice(index, 1);
          friends.friends.totalCount--;
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
  friends.currentRequest = request;
  state.showConfirmCancelRequest = true;
}

function onCancelCancelRequest() {
  state.showConfirmCancelRequest = false;
  friends.currentRequest = null;
}

async function onConfirmCancelRequest(): Promise<void> {
  state.isCancellingRequest = true;

  await oops(
    async () => {
      if (!currentUser.user || !friends.currentRequest) return;

      const request = client.friends.wrapFriendRequestDTO(
        currentUser.user.username,
        friends.currentRequest,
      );
      await request.cancel();

      const index = friends.requests.friendRequests.findIndex(
        (r) => r.friendId === friends.currentRequest?.friendId,
      );

      if (index > -1) {
        friends.requests.friendRequests.splice(index, 1);
        friends.requests.totalCount--;
      }

      toasts.toast({
        id: 'cancel-friend-request-succeeded',
        message: `You have successfully canceled your friend request to ${
          friends.currentRequest.friend.name ||
          `@${friends.currentRequest.friend.username}`
        }.`,
        type: ToastType.Success,
      });
    },
    {
      [404]: () => {
        toasts.toast({
          id: 'friend-request-not-found',
          message: `The friend request from ${
            friends.currentRequest?.friend.name ||
            `@${friends.currentRequest?.friend.username}`
          } no longer exists. Unable to cancel.`,
          type: ToastType.Warning,
        });

        const index = friends.requests.friendRequests.findIndex(
          (r) => r.friendId === friends.currentRequest?.friend.id,
        );
        if (index > -1) {
          friends.requests.friendRequests.splice(index, 1);
          friends.requests.totalCount--;
        }
      },
    },
  );

  state.showConfirmCancelRequest = false;
  state.isCancellingRequest = false;
  friends.currentRequest = null;
}

async function onDismissRequest(dto: FriendRequestDTO): Promise<void> {
  await oops(
    async () => {
      if (!currentUser.user) return;

      const request = client.friends.wrapFriendRequestDTO(
        currentUser.user.username,
        dto,
      );

      await request.cancel();

      const index = friends.requests.friendRequests.findIndex(
        (r) => r.friendId === request.friend.id,
      );

      if (index > -1) {
        friends.requests.friendRequests.splice(index, 1);
        friends.requests.totalCount--;
      }
    },
    {
      [404]: () => {
        const index = friends.requests.friendRequests.findIndex(
          (r) => r.friendId === dto.friend.id,
        );

        if (index > -1) {
          friends.requests.friendRequests.splice(index, 1);
          friends.requests.totalCount--;
        }
      },
    },
  );
}
</script>
