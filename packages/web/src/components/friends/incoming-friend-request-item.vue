<template>
  <li
    class="min-h-24 flex space-x-3 even:bg-blue-300/40 even:dark:bg-blue-900/40 rounded-md p-2 items-center"
  >
    <div class="min-w-[64px]">
      <UserAvatar
        :avatar="request.friend.avatar"
        :display-name="request.friend.name || request.friend.username"
        size="medium"
      />
    </div>

    <div v-if="state.mode === Mode.Normal" class="grow flex flex-col space-y-1">
      <p
        class="flex flex-col md:flex-row space-x-0 md:space-x-3 items-baseline"
      >
        <span class="text-2xl">
          {{ request.friend.name || `@${request.friend.username}` }}
        </span>
        <span v-if="request.friend.name" class="text-lg font-bold">
          {{ `@${request.friend.username}` }}
        </span>
      </p>

      <div
        class="flex flex-col lg:flex-row text-grey-400 space-x-0 lg:space-x-8"
      >
        <p class="flex space-x-2">
          <span class="font-bold min-w-20 text-right">Requested:</span>
          <span class="italic">{{ dayjs(request.created).format('lll') }}</span>
        </p>

        <p class="flex space-x-2">
          <span class="font-bold min-w-20 text-right">Expires:</span>
          <span class="italic">{{ dayjs(request.expires).format('lll') }}</span>
        </p>
      </div>
    </div>

    <div v-if="state.mode === Mode.Normal" class="flex space-x-3 px-2">
      <FormButton @click="onAccept">Accept</FormButton>
      <FormButton type="danger" @click="onDecline">Decline</FormButton>
    </div>

    <div
      v-if="state.mode === Mode.Accept"
      class="grow flex flex-col space-y-2 px-4"
    >
      <p class="text-xl italic text-right">
        <span>Are you sure you want to accept this friend request from </span>
        <span class="font-bold">
          {{ request.friend.name || `@${request.friend.username}` }}
        </span>
        <span>?</span>
      </p>

      <div class="flex space-x-2 justify-end">
        <FormButton type="primary" @click="onConfirmAccept">
          Accept
        </FormButton>

        <FormButton @click="onCancelAccept">Cancel</FormButton>
      </div>
    </div>

    <div
      v-if="state.mode === Mode.Decline"
      class="grow flex flex-col space-y-2 px-4"
    >
      <p class="text-xl italic text-right">
        <span>Are you sure you want to decline this friend request from </span>
        <span class="font-bold">
          {{ request.friend.name || `@${request.friend.username}` }}
        </span>
        <span>?</span>
      </p>

      <div class="flex flex-col lg:flex-row gap-2">
        <div class="flex space-x-3 items-center lg:grow">
          <label class="font-bold" for="decline-reason">Reason:</label>

          <FormTextBox
            v-model="state.declineReason"
            control-id="decline-reason"
            class="grow"
            test-id="decline-reason"
            placeholder="Enter an optional reason..."
            autofocus
          />
        </div>

        <div class="flex space-x-2 justify-end">
          <FormButton type="danger" @click="onConfirmDecline">
            Decline
          </FormButton>

          <FormButton @click="onCancelDecline">Cancel</FormButton>
        </div>
      </div>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { FriendRequestDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import { reactive } from 'vue';

import FormButton from '../common/form-button.vue';
import FormTextBox from '../common/form-text-box.vue';
import UserAvatar from '../users/user-avatar.vue';

enum Mode {
  Accept = 'accept',
  Decline = 'decline',
  Normal = 'normal',
}

interface IncomingFriendRequestItemProps {
  request: FriendRequestDTO;
}

interface IncomingFriendRequestItemState {
  declineReason: string;
  mode: Mode;
}

const props = defineProps<IncomingFriendRequestItemProps>();
const emit = defineEmits<{
  (e: 'accept', request: FriendRequestDTO): void;
  (e: 'decline', request: FriendRequestDTO, reason?: string): void;
  (e: 'select', request: FriendRequestDTO): void;
}>();

const state = reactive<IncomingFriendRequestItemState>({
  declineReason: '',
  mode: Mode.Normal,
});

function onAccept() {
  state.mode = Mode.Accept;
}

function onConfirmAccept() {
  emit('accept', props.request);
}

function onCancelAccept() {
  state.mode = Mode.Normal;
}

function onDecline() {
  state.mode = Mode.Decline;
}

function onConfirmDecline() {
  emit('decline', props.request, state.declineReason);
}

function onCancelDecline() {
  state.mode = Mode.Normal;
}
</script>
