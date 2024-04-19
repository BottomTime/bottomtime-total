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
        @right-button-click="onSearch"
      >
        <template #right>
          <i class="fas fa-search"></i>
        </template>
      </FormTextBox>
    </FormField>

    <SearchFriendsList
      :is-loading="state.isLoading"
      :users="state.users"
      @send-request="onSendRequest"
    />
  </form>
</template>

<script lang="ts" setup>
import { SearchProfilesResponseDTO, SuccinctProfileDTO } from '@bottomtime/api';

import { reactive } from 'vue';

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import { useOops } from '../../oops';
import { useCurrentUser, useToasts } from '../../store';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';
import SearchFriendsList from './search-friends-list.vue';

interface SearchFriendsFormData {
  query: string;
  isLoading: boolean;
  users: SearchProfilesResponseDTO;
}

const currentUser = useCurrentUser();
const client = useClient();
const oops = useOops();
const toasts = useToasts();

const state = reactive<SearchFriendsFormData>({
  query: '',
  isLoading: false,
  users: { totalCount: 0, users: [] },
});

async function onSearch(): Promise<void> {
  state.isLoading = true;

  await oops(async () => {
    state.users = await client.users.searchProfiles({
      query: state.query,
      filterFriends: true,
    });
  });

  state.isLoading = false;
}

async function onSendRequest(targetUser: SuccinctProfileDTO): Promise<void> {
  await oops(async () => {
    if (!currentUser.user) return;
    await client.friends.createFriendRequest(
      currentUser.user.username,
      targetUser.username,
    );

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
