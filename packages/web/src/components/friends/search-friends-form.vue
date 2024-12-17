<template>
  <form
    class="flex flex-col space-y-3"
    data-testid="search-friends-form"
    @submit.prevent=""
  >
    <FormField label="Search" control-id="search-user" :responsive="false">
      <FormTextBox
        v-model="state.query"
        control-id="search-users"
        :maxlength="200"
        placeholder="Search for users by their username or profile name"
        test-id="search-users"
        show-right
        autofocus
        @enter="onSearch"
        @esc="$emit('close')"
        @right-button-click="onSearch"
      >
        <template #right>
          <i class="fas fa-search"></i>
        </template>
      </FormTextBox>
    </FormField>

    <SearchFriendsList
      v-if="state.users"
      :is-loading="state.isLoading"
      :is-loading-more="state.isLoadingMore"
      :users="state.users"
      @load-more="onLoadMore"
      @send-request="onSendRequest"
    />

    <div
      v-else
      class="flex justify-center mx-12 py-8 text-blue-800 dark:text-blue-400 space-x-4"
      data-testid="begin-search-message"
    >
      <p class="my-2">
        <i class="fa-solid fa-magnifying-glass fa-xl"></i>
      </p>

      <div class="space-y-2">
        <p class="font-bold text-xl">
          Search for your next new dive buddy above!
        </p>

        <p class="text-lg italic">
          You can search for users by their username or profile information!
        </p>
      </div>
    </div>
  </form>
</template>

<script lang="ts" setup>
import {
  ApiList,
  FriendRequestDTO,
  ProfileDTO,
  SuccinctProfileDTO,
} from '@bottomtime/api';

import { reactive } from 'vue';

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';
import SearchFriendsList from './search-friends-list.vue';

interface SearchFriendsFormState {
  query: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  users?: ApiList<ProfileDTO>;
}

const currentUser = useCurrentUser();
const client = useClient();
const oops = useOops();
const toasts = useToasts();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'request-sent', request: FriendRequestDTO): void;
}>();

const state = reactive<SearchFriendsFormState>({
  query: '',
  isLoading: false,
  isLoadingMore: false,
});

async function onSearch(): Promise<void> {
  state.isLoading = true;

  await oops(async () => {
    state.users = await client.userProfiles.searchProfiles({
      query: state.query,
      filterFriends: true,
      limit: 50,
    });
  });

  state.isLoading = false;
}

async function onLoadMore(): Promise<void> {
  state.isLoadingMore = true;

  await oops(async () => {
    if (!state.users) return;

    const results = await client.userProfiles.searchProfiles({
      query: state.query,
      filterFriends: true,
      skip: state.users?.data.length,
      limit: 50,
    });

    state.users.data.push(...results.data);
    state.users.totalCount = results.totalCount;
  });

  state.isLoadingMore = false;
}

async function onSendRequest(targetUser: SuccinctProfileDTO): Promise<void> {
  await oops(async () => {
    if (!currentUser.user) return;
    const newRequest = await client.friends.createFriendRequest(
      currentUser.user.username,
      targetUser.username,
    );

    emit('request-sent', newRequest);

    toasts.toast({
      id: 'friend-request-sent',
      message: `Friend request has successfully been sent to ${
        targetUser.name || `@${targetUser.username}`
      }.`,
      type: ToastType.Success,
    });
  });
}
</script>
