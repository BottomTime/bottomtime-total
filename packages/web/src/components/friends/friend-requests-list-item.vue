<template>
  <li class="my-3 flex items-start space-x-3">
    <div class="mx-2 min-w-[64px]">
      <UserAvatar
        :avatar="request.friend.avatar"
        :display-name="request.friend.name || request.friend.username"
        size="medium"
      />
    </div>

    <div v-if="showConfirmAccept" class="grow">
      <p class="text-xl italic">
        <span>Do you confirm accepting friend request from </span>
        <span class="font-bold">
          {{
            request.friend.name
              ? request.friend.name
              : `@${request.friend.username}`
          }}
        </span>
        <span>?</span>
      </p>
    </div>

    <div v-else-if="showConfirmDecline" class="grow">
      <p class="text-lg italic">
        <span>Do you confirm declining friend request from </span>
        <span class="font-bold">
          {{
            request.friend.name
              ? request.friend.name
              : `@${request.friend.username}`
          }}
        </span>
        <span>?</span>
      </p>
      <p class="text-sm mb-2">You may provide an optional reason if you do.</p>

      <FormField control-id="reason" label="Reason" :responsive="false">
        <FormTextBox
          v-model="declineReason"
          control-id="reason"
          :maxlength="500"
          autofocus
        />
      </FormField>
    </div>

    <div v-else class="grow flex flex-col space-y-2">
      <NavLink class="text-2xl" to="#">
        {{ `@${request.friend.username}` }}
      </NavLink>

      <p v-if="request.friend.name" class="flex space-x-2">
        <span>
          <i class="fas fa-user"></i>
        </span>
        <span>{{ request.friend.name }}</span>
      </p>

      <p v-if="request.friend.location" class="flex space-x-2">
        <span>
          <i class="fas fa-map-marker-alt"></i>
        </span>
        <span>{{ request.friend.location }}</span>
      </p>
    </div>

    <div v-if="showConfirmAccept" class="flex mx-2 space-x-3">
      <FormButton type="primary" @click="onConfirmAccept">
        Accept Request
      </FormButton>
      <FormButton @click="onCancelAccept">Cancel</FormButton>
    </div>

    <div v-else-if="showConfirmDecline" class="flex mx-2 space-x-3">
      <FormButton type="danger" @click="onConfirmReject">
        Decline Request
      </FormButton>
      <FormButton @click="onCancelReject">Cancel</FormButton>
    </div>

    <div
      v-else-if="
        request.direction === FriendRequestDirection.Incoming &&
        typeof request.accepted !== 'boolean'
      "
      class="flex mx-2 space-x-3"
    >
      <FormButton @click="onAcceptRequest">Accept</FormButton>
      <FormButton type="danger" @click="onRejectRequest">Decline</FormButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { FriendRequestDTO, FriendRequestDirection } from '@bottomtime/api';

import { ref } from 'vue';

import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';
import NavLink from '../common/nav-link.vue';
import UserAvatar from '../users/user-avatar.vue';

interface FriendRequestsListItemProps {
  request: FriendRequestDTO;
}

const props = defineProps<FriendRequestsListItemProps>();
const emit = defineEmits<{
  (e: 'accept', request: FriendRequestDTO): void;
  (e: 'reject', request: FriendRequestDTO): void;
}>();

const showConfirmAccept = ref(false);
const showConfirmDecline = ref(false);
const declineReason = ref('');

function onAcceptRequest() {
  showConfirmAccept.value = true;
}

function onConfirmAccept() {
  emit('accept', props.request);
}

function onCancelAccept() {
  showConfirmAccept.value = false;
}

function onRejectRequest() {
  declineReason.value = '';
  showConfirmDecline.value = true;
}

function onConfirmReject() {
  emit('reject', props.request);
}

function onCancelReject() {
  showConfirmDecline.value = false;
}
</script>
