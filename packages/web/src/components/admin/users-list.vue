<template>
  <DrawerPanel
    :title="state.selectedUser?.username"
    :visible="!!state.selectedUser"
    :edit="`/admin/users/${state.selectedUser?.username}`"
    @close="onCloseManageUser"
  >
    <ManageUser
      v-if="state.selectedUser"
      :user="state.selectedUser"
      @account-lock-toggled="onAccountLockToggled"
      @role-changed="onRoleChanged"
      @username-changed="onUsernameChanged"
      @email-changed="onEmailChanged"
      @password-reset="onPasswordReset"
      @save-profile="onSaveProfile"
      @save-settings="onSaveSettings"
    />
  </DrawerPanel>
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <!-- Search criteria panel -->
    <FormBox>
      <form class="flex flex-col sticky top-20" @submit.prevent="">
        <FormField :responsive="false">
          <FormTextBox
            v-model="state.searchParams.query"
            control-id="search"
            :maxlength="200"
            placeholder="Search users"
            test-id="search-users"
            autofocus
          >
            <template #right>
              <span class="pointer-events-auto dark:text-grey-950">
                <i class="fas fa-search"></i>
              </span>
            </template>
          </FormTextBox>
        </FormField>
        <FormField label="Role" control-id="role" :responsive="false">
          <FormSelect
            v-model="state.searchParams.role"
            control-id="role"
            test-id="role"
            :options="UserRoleOptions"
            stretch
          />
        </FormField>
        <FormField
          label="Account status"
          control-id="account-status"
          :responsive="false"
        >
          <FormSelect
            v-model="state.searchParams.isLockedOut"
            control-id="account-status"
            test-id="account-status"
            :options="AccountStatusOptions"
            stretch
          />
        </FormField>
        <div class="text-center">
          <FormButton
            type="primary"
            test-id="refresh"
            submit
            @click="refreshUsers"
          >
            Refresh
          </FormButton>
        </div>
      </form>
    </FormBox>

    <div class="lg:col-span-3">
      <!-- Summary bar and sort order select -->
      <FormBox
        class="flex flex-row gap-2 justify-between items-baseline sticky top-16"
      >
        <p>
          <span>Showing </span>
          <span class="font-bold">{{ state.results.data.length }}</span>
          <span> of </span>
          <span class="font-bold">{{ state.results.totalCount }}</span>
          <span> users</span>
        </p>
        <div class="flex gap-2 items-baseline">
          <label for="sort-order" class="font-bold">Sort order:</label>
          <FormSelect
            v-model="state.searchParams.sortOrder"
            control-id="sort-order"
            test-id="sort-order"
            :options="SortOrderOptions"
            @change="refreshUsers"
          />
        </div>
      </FormBox>

      <!-- Loading message -->
      <div v-if="state.isLoading" class="mt-6 text-lg text-center text-info">
        <LoadingSpinner v-if="state.isLoading" message="Loading users..." />
      </div>

      <!-- No results found message -->
      <p
        v-else-if="state.results.data.length === 0"
        class="mt-6 text-lg text-warn"
        data-testid="users-list-no-users"
      >
        <span class="pr-2">
          <i class="fas fa-exclamation-triangle"></i>
        </span>
        <span> No users found matching your search criteria.</span>
      </p>

      <TransitionList v-else class="mx-2" data-testid="users-list">
        <UsersListItem
          v-for="user in state.results.data"
          :key="user.id"
          :user="user"
          @user-click="onUserClick"
        />
      </TransitionList>
      <div
        v-if="state.results.data.length < state.results.totalCount"
        class="text-center text-lg my-4"
      >
        <div
          v-if="state.isLoadingMore"
          class="mt-4 flex gap-3 justify-center align-middle"
        >
          <span>
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          <span>Loading...</span>
        </div>

        <a
          v-else
          data-testid="users-list-load-more"
          class="space-x-1"
          @click="onLoadMore"
        >
          <span>
            <i class="fa-solid fa-arrow-down"></i>
          </span>
          <span>Load more results...</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AdminSearchUsersParamsDTO,
  ApiList,
  ProfileDTO,
  SortOrder,
  UserDTO,
  UserRole,
  UserSettingsDTO,
  UsersSortBy,
} from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../api-client';
import { SelectOption } from '../../common';
import { useOops } from '../../oops';
import DrawerPanel from '../common/drawer-panel.vue';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextBox from '../common/form-text-box.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import TransitionList from '../common/transition-list.vue';
import ManageUser from './manage-user.vue';
import UsersListItem from './users-list-item.vue';

interface UsersListState {
  results: ApiList<UserDTO>;
  searchParams: {
    isLockedOut: string;
    query: string;
    role: UserRole | '';
    sortOrder: string;
  };
  isLoading: boolean;
  isLoadingMore: boolean;
  selectedUser?: UserDTO;
}

const SortOrderOptions: SelectOption[] = [
  {
    label: 'By username',
    value: `${UsersSortBy.Username}-${SortOrder.Ascending}`,
  },
  {
    label: 'By sign up date (asc)',
    value: `${UsersSortBy.MemberSince}-${SortOrder.Ascending}`,
  },
  {
    label: 'By sign up date (desc)',
    value: `${UsersSortBy.MemberSince}-${SortOrder.Descending}`,
  },
];
const UserRoleOptions: SelectOption[] = [
  { label: 'All', value: '' },
  { label: 'Admin', value: UserRole.Admin },
  { label: 'User', value: UserRole.User },
];
const AccountStatusOptions: SelectOption[] = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
];

const client = useClient();
const oops = useOops();

const state = reactive<UsersListState>({
  isLoading: true,
  isLoadingMore: false,
  results: {
    data: [],
    totalCount: 0,
  },
  searchParams: {
    isLockedOut: '',
    query: '',
    role: '',
    sortOrder: SortOrderOptions[0].value,
  },
});

function getSearchParameters(): AdminSearchUsersParamsDTO {
  const [sortBy, sortOrder] = state.searchParams.sortOrder.split('-');
  return {
    query: state.searchParams.query || undefined,
    role: state.searchParams.role || undefined,
    sortBy: sortBy as UsersSortBy,
    sortOrder: sortOrder as SortOrder,
    skip: 0,
    limit: 50,
  };
}

async function refreshUsers(): Promise<void> {
  const params = getSearchParameters();

  state.isLoading = true;
  await oops(async () => {
    state.results = await client.userAccounts.searchUsers(params);
  });
  state.isLoading = false;
}

async function onLoadMore(): Promise<void> {
  const params = getSearchParameters();
  params.skip = state.results.data.length;

  state.isLoadingMore = true;
  await oops(async () => {
    const response = await client.userAccounts.searchUsers(params);
    state.results.data.push(...response.data);
    state.results.totalCount = response.totalCount;
  });
  state.isLoadingMore = false;
}

function onUserClick(user: UserDTO): void {
  state.selectedUser = user;
}

function onCloseManageUser() {
  state.selectedUser = undefined;
}

function onAccountLockToggled() {
  if (state.selectedUser) {
    state.selectedUser.isLockedOut = !state.selectedUser.isLockedOut;
  }
}

function onRoleChanged(_id: string, role: UserRole) {
  if (state.selectedUser) {
    state.selectedUser.role = role;
  }
}

function onUsernameChanged(_id: string, username: string) {
  if (state.selectedUser) {
    state.selectedUser.username = username;
  }
}

function onEmailChanged(_id: string, email: string) {
  if (state.selectedUser) {
    state.selectedUser.email = email;
    state.selectedUser.emailVerified = false;
  }
}

function onPasswordReset() {
  if (state.selectedUser) {
    state.selectedUser.hasPassword = true;
    state.selectedUser.lastPasswordChange = Date.now();
  }
}

function onSaveSettings(_id: string, settings: UserSettingsDTO) {
  if (state.selectedUser) {
    state.selectedUser.settings = settings;
  }
}

function onSaveProfile(_id: string, profile: ProfileDTO) {
  if (state.selectedUser) {
    state.selectedUser.profile = profile;
  }
}

onMounted(refreshUsers);
</script>
