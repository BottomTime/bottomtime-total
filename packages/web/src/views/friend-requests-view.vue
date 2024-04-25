<template>
  <PageTitle title="Friend Requests" />

  <!-- Accept request dialog -->
  <ConfirmDialog
    :visible="state.showConfirmAccept && !!state.selectedRequest"
    confirm-text="Accept"
    title="Accept friend request?"
    :is-loading="state.isAcceptingRequest"
    @confirm="onConfirmAcceptRequest"
    @cancel="onCancelAcceptRequest"
  >
    <div class="flex space-x-3">
      <div class="my-2">
        <i class="fa-regular fa-circle-question fa-2x"></i>
      </div>

      <div>
        <p>
          <span>Are you sure you want to accept a friend request from </span>
          <span class="font-bold">
            {{
              state.selectedRequest?.friend.name ||
              `@${state.selectedRequest?.friend.username}`
            }}
          </span>
          <span>?</span>
        </p>
      </div>
    </div>
  </ConfirmDialog>

  <!-- Decline request dialog -->
  <ConfirmDialog
    :visible="state.showConfirmDecline && !!state.selectedRequest"
    confirm-text="Decline"
    title="Decline friend request?"
    :is-loading="state.isDecliningRequest"
    dangerous
    size="md"
    @confirm="onConfirmDeclineRequest"
    @cancel="onCancelDeclineRequest"
  >
    <div class="flex space-x-3">
      <div class="my-2">
        <i class="fa-regular fa-circle-question fa-2x"></i>
      </div>

      <div class="space-y-2">
        <p>
          <span>Are you sure you want to decline a friend request from </span>
          <span class="font-bold">
            {{
              state.selectedRequest?.friend.name ||
              `@${state.selectedRequest?.friend.username}`
            }}
          </span>
          <span>? You can provide an optional reason.</span>
        </p>

        <FormField
          control-id="decline-reason"
          label="Reason"
          :responsive="false"
        >
          <FormTextBox
            v-model="state.declineReason"
            placeholder="Reason for declining request..."
            control-id="decline-reason"
            test-id="decline-reason"
            :maxlength="500"
            autofocus
            @enter="onConfirmDeclineRequest"
            @esc="onCancelDeclineRequest"
          />
        </FormField>
      </div>
    </div>
  </ConfirmDialog>

  <ProfilePanel
    :profile="state.friendProfile"
    :visible="state.showFriendProfile"
    @close="onCloseFriendProfile"
  />

  <!-- Profile viewer -->
  <RequireAuth>
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
        :requests="state.friendRequests"
        @accept="onAcceptRequest"
        @decline="onDeclineRequest"
        @dismiss="onDismissFriendRequest"
        @select="onSelectFriendRequest"
      />
    </div>
  </RequireAuth>
</template>

<script lang="ts" setup>
import {
  FriendRequestDTO,
  FriendRequestDirection,
  ListFriendRequestsResponseDTO,
  ProfileDTO,
} from '@bottomtime/api';

import { onServerPrefetch, reactive, useSSRContext } from 'vue';

import { useClient } from '../api-client';
import { ToastType } from '../common';
import FormField from '../components/common/form-field.vue';
import FormTextBox from '../components/common/form-text-box.vue';
import PageTitle from '../components/common/page-title.vue';
import RequireAuth from '../components/common/require-auth.vue';
import ConfirmDialog from '../components/dialog/confirm-dialog.vue';
import FriendRequestsList from '../components/friends/friend-requests-list.vue';
import ProfilePanel from '../components/users/profile-panel.vue';
import { Config } from '../config';
import { AppInitialState, useInitialState } from '../initial-state';
import { useOops } from '../oops';
import { useCurrentUser, useToasts } from '../store';

interface FriendRequestsViewState {
  declineReason: string;
  friendProfile?: ProfileDTO | null;
  friendRequests: ListFriendRequestsResponseDTO;
  isAcceptingRequest: boolean;
  isDecliningRequest: boolean;
  selectedRequest: FriendRequestDTO | null;
  showConfirmAccept: boolean;
  showConfirmDecline: boolean;
  showFriendProfile: boolean;
}

const client = useClient();
const ctx = Config.isSSR ? useSSRContext<AppInitialState>() : null;
const currentUser = useCurrentUser();
const initialState = useInitialState();
const oops = useOops();
const toasts = useToasts();

const state = reactive<FriendRequestsViewState>({
  declineReason: '',
  friendRequests: initialState?.friendRequests
    ? initialState.friendRequests
    : { friendRequests: [], totalCount: 0 },
  isAcceptingRequest: false,
  isDecliningRequest: false,
  selectedRequest: null,
  showConfirmAccept: false,
  showConfirmDecline: false,
  showFriendProfile: false,
});

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

    state.friendRequests = {
      friendRequests: friendRequestsResults.friendRequests.map((friend) =>
        friend.toJSON(),
      ),
      totalCount: friendRequestsResults.totalCount,
    };

    if (ctx) {
      ctx.friendRequests = state.friendRequests;
    }
  });
});

function onAcceptRequest(request: FriendRequestDTO) {
  state.selectedRequest = request;
  state.showConfirmAccept = true;
}

function onCancelAcceptRequest() {
  state.showConfirmAccept = false;
  state.selectedRequest = null;
}

async function onConfirmAcceptRequest() {
  state.isAcceptingRequest = true;

  await oops(
    async () => {
      if (!currentUser.user) return;

      const request = client.friends.wrapFriendRequestDTO(
        currentUser.user.username,
        state.selectedRequest,
      );

      await request.accept();

      const index = state.friendRequests.friendRequests.findIndex(
        (r) => r.friendId === request.friend.id,
      );
      if (index > -1) {
        state.friendRequests.friendRequests[index].accepted = true;
      }

      toasts.toast({
        id: 'friend-request-accepted',
        message: `You are now friends with ${
          request.friend.name || request.friend.username
        }.`,
        type: ToastType.Success,
      });
    },
    {
      [404]: () => {
        toasts.toast({
          id: 'friend-request-not-found',
          message: `The friend request from ${
            state.selectedRequest?.friend.name ||
            `@${state.selectedRequest?.friend.username}`
          } no longer exists. Unable to accept.`,
          type: ToastType.Warning,
        });

        const index = state.friendRequests.friendRequests.findIndex(
          (r) => r.friendId === state.selectedRequest?.friend.id,
        );
        if (index > -1) {
          state.friendRequests.friendRequests.splice(index, 1);
          state.friendRequests.totalCount--;
        }
      },
    },
  );

  state.isAcceptingRequest = false;
  state.showConfirmAccept = false;
  state.selectedRequest = null;
}

function onDeclineRequest(request: FriendRequestDTO, reason?: string) {
  state.selectedRequest = request;
  state.declineReason = reason || '';
  state.showConfirmDecline = true;
}

function onCancelDeclineRequest() {
  state.showConfirmDecline = false;
  state.selectedRequest = null;
}

async function onConfirmDeclineRequest() {
  state.isDecliningRequest = true;

  await oops(
    async () => {
      if (!currentUser.user || !state.selectedRequest) return;

      const request = client.friends.wrapFriendRequestDTO(
        currentUser.user.username,
        state.selectedRequest,
      );

      await request.decline(state.declineReason);

      const index = state.friendRequests.friendRequests.findIndex(
        (r) => r.friendId === request.friend.id,
      );
      if (index > -1) {
        state.friendRequests.friendRequests[index].accepted = false;
        state.friendRequests.friendRequests[index].reason = state.declineReason;
      }

      toasts.toast({
        id: 'friend-request-declined',
        message: `You have successfully declined friend request from ${
          request.friend.name || request.friend.username
        }.`,
        type: ToastType.Success,
      });
    },
    {
      [404]: () => {
        toasts.toast({
          id: 'friend-request-not-found',
          message: `The friend request from ${
            state.selectedRequest?.friend.name ||
            `@${state.selectedRequest?.friend.username}`
          } no longer exists. Unable to decline.`,
          type: ToastType.Warning,
        });

        const index = state.friendRequests.friendRequests.findIndex(
          (r) => r.friendId === state.selectedRequest?.friend.id,
        );
        if (index > -1) {
          state.friendRequests.friendRequests.splice(index, 1);
          state.friendRequests.totalCount--;
        }
      },
    },
  );

  state.showConfirmDecline = false;
  state.isDecliningRequest = false;
  state.selectedRequest = null;
}

function onDismissFriendRequest(dto: FriendRequestDTO) {
  const index = state.friendRequests.friendRequests.findIndex(
    (r) => r.friendId === dto.friend.id,
  );
  if (index > -1) {
    state.friendRequests.friendRequests.splice(index, 1);
    state.friendRequests.totalCount--;
  }
}

async function onSelectFriendRequest(request: FriendRequestDTO): Promise<void> {
  state.friendProfile = undefined;
  state.selectedRequest = request;
  state.showFriendProfile = true;

  await oops(
    async () => {
      state.friendProfile = await client.users.getProfile(
        request.friend.username,
      );
    },
    {
      [404]: () => {
        state.friendProfile = null;
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
}

function onCloseFriendProfile() {
  state.showFriendProfile = false;
  state.selectedRequest = null;
}
</script>
