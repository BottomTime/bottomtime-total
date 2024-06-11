<template>
  <DrawerPanel
    :title="selectedUser?.username"
    :visible="!!selectedUser"
    :full-screen="`/admin/users/${selectedUser?.username}`"
    @close="onCloseManageUser"
  >
    <ManageUser
      v-if="selectedUser"
      :user="selectedUser"
      @account-lock-toggled="onAccountLockToggled"
      @role-changed="onRoleChanged"
      @username-changed="onUsernameChanged"
      @email-changed="onEmailChanged"
      @password-reset="onPasswordReset"
      @save-profile="onSaveProfile"
      @save-settings="onSaveSettings"
    />
  </DrawerPanel>
  <div class="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-8 gap-6">
    <!-- Search criteria panel -->
    <FormBox class="xl:col-start-2 xl:col-span-2">
      <form class="flex flex-col sticky top-20" @submit.prevent="">
        <FormField :responsive="false">
          <FormTextBox
            v-model="searchParams.query"
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
            v-model="searchParams.role"
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
            v-model="searchParams.isLockedOut"
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

    <div class="lg:col-span-3 xl:col-span-4">
      <!-- Summary bar and sort order select -->
      <FormBox class="flex flex-row gap-2 items-baseline sticky top-16">
        <span class="font-bold">Showing Users:</span>
        <span>{{ admin.users.users.length }}</span>
        <span>of</span>
        <span class="grow">{{ admin.users.totalCount }}</span>
        <label for="sort-order" class="font-bold">Sort order:</label>
        <FormSelect
          v-model="searchParams.sortOrder"
          control-id="sort-order"
          test-id="sort-order"
          :options="SortOrderOptions"
          @change="refreshUsers"
        />
      </FormBox>

      <!-- Loading message -->
      <div v-if="isLoading" class="mt-6 text-lg text-center text-info">
        <LoadingSpinner v-if="isLoading" message="Loading users..." />
      </div>

      <!-- No results found message -->
      <p
        v-else-if="admin.users.users.length === 0"
        class="mt-6 text-lg text-warn"
        data-testid="users-list-no-users"
      >
        <span class="pr-2">
          <i class="fas fa-exclamation-triangle"></i>
        </span>
        <span> No users found matching your search criteria.</span>
      </p>

      <ul v-else data-testid="users-list">
        <UsersListItem
          v-for="user in admin.users.users"
          :key="user.id"
          :user="user"
          @user-click="onUserClick"
        />

        <li class="text-center text-lg mt-2">
          <div
            v-if="isLoadingMore"
            class="mt-4 flex gap-3 justify-center align-middle"
          >
            <span>
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span>Loading...</span>
          </div>

          <FormButton
            v-else
            type="link"
            :disabled="noMoreResults"
            test-id="users-list-load-more"
            @click="onLoadMore"
          >
            <span>
              {{
                noMoreResults ? 'No more results to show' : 'Load more results'
              }}
            </span>
          </FormButton>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AdminSearchUsersParamsDTO,
  AdminSearchUsersResponseSchema,
  ProfileDTO,
  SortOrder,
  UserDTO,
  UserRole,
  UserSettingsDTO,
  UsersSortBy,
} from '@bottomtime/api';

import { onBeforeMount, onServerPrefetch, reactive, ref } from 'vue';

import { useClient } from '../../api-client';
import { SelectOption } from '../../common';
import { useOops } from '../../oops';
import { useAdmin } from '../../store';
import DrawerPanel from '../common/drawer-panel.vue';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextBox from '../common/form-text-box.vue';
import LoadingSpinner from '../common/loading-spinner.vue';
import ManageUser from './manage-user.vue';
import UsersListItem from './users-list-item.vue';

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

const admin = useAdmin();
const client = useClient();
const oops = useOops();

const searchParams = reactive<{
  isLockedOut: string;
  query: string;
  role: UserRole | '';
  sortOrder: string;
}>({
  isLockedOut: '',
  query: '',
  role: '',
  sortOrder: SortOrderOptions[0].value,
});
const isLoading = ref(false);
const isLoadingMore = ref(false);
const noMoreResults = ref(false);
const selectedUser = ref<UserDTO | null>(null);

function getSearchParameters(): AdminSearchUsersParamsDTO {
  const [sortBy, sortOrder] = searchParams.sortOrder.split('-');
  return {
    query: searchParams.query || undefined,
    role: searchParams.role || undefined,
    sortBy: sortBy as UsersSortBy,
    sortOrder: sortOrder as SortOrder,
    skip: 0,
    limit: 50,
  };
}

async function refreshUsers(): Promise<void> {
  const params = getSearchParameters();

  isLoading.value = true;
  await oops(async () => {
    const response = await client.users.searchUsers(params);
    admin.users = {
      users: response.users.map((u) => u.toJSON()),
      totalCount: response.totalCount,
    };
  });
  noMoreResults.value = admin.users.users.length < (params.limit || 50);
  isLoading.value = false;
}

async function onLoadMore(): Promise<void> {
  const params = getSearchParameters();
  params.skip = admin.users.users.length;

  isLoadingMore.value = true;
  let resultCount = params.limit;
  await oops(async () => {
    const response = await client.users.searchUsers(params);
    resultCount = response.users.length;
    admin.users.users.push(...response.users.map((u) => u.toJSON()));
    admin.users.totalCount = response.totalCount;
  });
  noMoreResults.value = resultCount ? resultCount < (params.limit || 50) : true;
  isLoadingMore.value = false;
}

onServerPrefetch(async () => {
  const params = getSearchParameters();
  const response = await client.users.searchUsers(params);
  admin.users.users = response.users.map((u) => u.toJSON());
  admin.users.totalCount = response.totalCount;
});

onBeforeMount(() => {
  admin.users = AdminSearchUsersResponseSchema.parse(admin.users);
});

function onUserClick(user: UserDTO): void {
  selectedUser.value = user;
}

function onCloseManageUser() {
  selectedUser.value = null;
}

function onAccountLockToggled() {
  if (selectedUser.value) {
    selectedUser.value.isLockedOut = !selectedUser.value.isLockedOut;
  }
}

function onRoleChanged(_id: string, role: UserRole) {
  if (selectedUser.value) {
    selectedUser.value.role = role;
  }
}

function onUsernameChanged(_id: string, username: string) {
  if (selectedUser.value) {
    selectedUser.value.username = username;
  }
}

function onEmailChanged(_id: string, email: string) {
  if (selectedUser.value) {
    selectedUser.value.email = email;
    selectedUser.value.emailVerified = false;
  }
}

function onPasswordReset() {
  if (selectedUser.value) {
    selectedUser.value.hasPassword = true;
    selectedUser.value.lastPasswordChange = new Date();
  }
}

function onSaveSettings(_id: string, settings: UserSettingsDTO) {
  if (selectedUser.value) {
    selectedUser.value.settings = settings;
  }
}

function onSaveProfile(_id: string, profile: ProfileDTO) {
  if (selectedUser.value) {
    selectedUser.value.profile = profile;
  }
}
</script>
