<template>
  <PageTitle title="Friend Requests" />

  <!-- Accept request dialog -->
  <ConfirmDialog
    :visible="state.showConfirmAccept && !!state.currentRequest"
    confirm-text="Accept"
    title="Accept friend request?"
    icon="fa-regular fa-circle-question fa-2x"
    :is-loading="state.isAcceptingRequest"
    @confirm="onConfirmAcceptRequest"
    @cancel="onCancelAcceptRequest"
  >
    <p>
      <span>Are you sure you want to accept a friend request from </span>
      <span class="font-bold">
        {{
          state.currentRequest?.friend.name ||
          `@${state.currentRequest?.friend.username}`
        }}
      </span>
      <span>?</span>
    </p>
  </ConfirmDialog>

  <!-- Decline request dialog -->
  <ConfirmDialog
    :visible="state.showConfirmDecline && !!state.currentRequest"
    confirm-text="Decline"
    title="Decline friend request?"
    icon="fa-regular fa-circle-question fa-2x"
    :is-loading="state.isDecliningRequest"
    dangerous
    size="md"
    @confirm="onConfirmDeclineRequest"
    @cancel="onCancelDeclineRequest"
  >
    <p>
      <span>Are you sure you want to decline a friend request from </span>
      <span class="font-bold">
        {{
          state.currentRequest?.friend.name ||
          `@${state.currentRequest?.friend.username}`
        }}
      </span>
      <span>? You can provide an optional reason.</span>
    </p>

    <FormField control-id="decline-reason" label="Reason" :responsive="false">
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
  </ConfirmDialog>

  <ProfilePanel
    :profile="state.currentProfile ?? undefined"
    :is-loading="state.isLoadingProfile"
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
        :requests="state.results"
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
  ApiList,
  FriendRequestDTO,
  FriendRequestDirection,
  ProfileDTO,
} from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import FormField from '../../components/common/form-field.vue';
import FormTextBox from '../../components/common/form-text-box.vue';
import PageTitle from '../../components/common/page-title.vue';
import RequireAuth from '../../components/common/require-auth.vue';
import ConfirmDialog from '../../components/dialog/confirm-dialog.vue';
import FriendRequestsList from '../../components/friends/friend-requests-list.vue';
import ProfilePanel from '../../components/users/profile-panel.vue';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';

interface FriendRequestsViewState {
  currentProfile?: ProfileDTO;
  currentRequest?: FriendRequestDTO;
  declineReason: string;
  isAcceptingRequest: boolean;
  isDecliningRequest: boolean;
  isLoadingProfile: boolean;
  results: ApiList<FriendRequestDTO>;
  showConfirmAccept: boolean;
  showConfirmDecline: boolean;
  showFriendProfile: boolean;
}

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const toasts = useToasts();

const state = reactive<FriendRequestsViewState>({
  declineReason: '',
  isAcceptingRequest: false,
  isDecliningRequest: false,
  isLoadingProfile: false,
  results: {
    data: [],
    totalCount: 0,
  },
  showConfirmAccept: false,
  showConfirmDecline: false,
  showFriendProfile: false,
});

onMounted(async () => {
  await oops(async () => {
    if (!currentUser.user) return;

    const friendRequestsResults = await client.friends.listFriendRequests(
      currentUser.user.username,
      {
        direction: FriendRequestDirection.Incoming,
        showAcknowledged: false,
      },
    );

    state.results.data = friendRequestsResults.data.map((friend) =>
      friend.toJSON(),
    );
    state.results.totalCount = friendRequestsResults.totalCount;
  });
});

function onAcceptRequest(request: FriendRequestDTO) {
  state.currentRequest = request;
  state.showConfirmAccept = true;
}

function onCancelAcceptRequest() {
  state.showConfirmAccept = false;
  state.currentRequest = undefined;
}

async function onConfirmAcceptRequest() {
  state.isAcceptingRequest = true;

  await oops(
    async () => {
      if (!currentUser.user) return;

      const request = client.friends.wrapFriendRequestDTO(
        currentUser.user.username,
        state.currentRequest,
      );

      await request.accept();

      const index = state.results.data.findIndex(
        (r) => r.friendId === request.friend.id,
      );
      if (index > -1) {
        state.results.data[index].accepted = true;
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
            state.currentRequest?.friend.name ||
            `@${state.currentRequest?.friend.username}`
          } no longer exists. Unable to accept.`,
          type: ToastType.Warning,
        });

        const index = state.results.data.findIndex(
          (r) => r.friendId === state.currentRequest?.friend.id,
        );
        if (index > -1) {
          state.results.data.splice(index, 1);
          state.results.totalCount--;
        }
      },
    },
  );

  state.isAcceptingRequest = false;
  state.showConfirmAccept = false;
  state.currentRequest = undefined;
}

function onDeclineRequest(request: FriendRequestDTO, reason?: string) {
  state.currentRequest = request;
  state.declineReason = reason || '';
  state.showConfirmDecline = true;
}

function onCancelDeclineRequest() {
  state.showConfirmDecline = false;
  state.currentRequest = undefined;
}

async function onConfirmDeclineRequest() {
  state.isDecliningRequest = true;

  await oops(
    async () => {
      if (!currentUser.user || !state.currentRequest) return;

      const request = client.friends.wrapFriendRequestDTO(
        currentUser.user.username,
        state.currentRequest,
      );

      await request.decline(state.declineReason);

      const index = state.results.data.findIndex(
        (r) => r.friendId === request.friend.id,
      );
      if (index > -1) {
        state.results.data[index].accepted = false;
        state.results.data[index].reason = state.declineReason;
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
            state.currentRequest?.friend.name ||
            `@${state.currentRequest?.friend.username}`
          } no longer exists. Unable to decline.`,
          type: ToastType.Warning,
        });

        const index = state.results.data.findIndex(
          (r) => r.friendId === state.currentRequest?.friend.id,
        );
        if (index > -1) {
          state.results.data.splice(index, 1);
          state.results.totalCount--;
        }
      },
    },
  );

  state.showConfirmDecline = false;
  state.isDecliningRequest = false;
  state.currentRequest = undefined;
}

function onDismissFriendRequest(dto: FriendRequestDTO) {
  const index = state.results.data.findIndex(
    (r) => r.friendId === dto.friend.id,
  );
  if (index > -1) {
    state.results.data.splice(index, 1);
    state.results.totalCount--;
  }
}

async function onSelectFriendRequest(request: FriendRequestDTO): Promise<void> {
  state.isLoadingProfile = true;
  state.currentProfile = undefined;
  state.currentRequest = request;
  state.showFriendProfile = true;

  await oops(
    async () => {
      state.currentProfile = await client.users.getProfile(
        request.friend.username,
      );
    },
    {
      [404]: () => {
        /* No-op. A "not found message" will be displayed. */
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

function onCloseFriendProfile() {
  state.showFriendProfile = false;
  state.currentRequest = undefined;
}
</script>
