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
            :options="AccountStatusOptions"
            stretch
          />
        </FormField>
        <div class="text-center">
          <FormButton type="primary" submit @click="refreshUsers">
            Refresh
          </FormButton>
        </div>
      </form>
    </FormBox>

    <div class="lg:col-span-3 xl:col-span-4">
      <!-- Summary bar and sort order select -->
      <FormBox class="flex flex-row gap-3 items-baseline sticky top-16">
        <span class="font-bold">Showing Users:</span>
        <span class="font-title"> {{ data.users.length }} </span>
        <span>of </span>
        <span class="grow font-title"> {{ data.totalUsers }} </span>
        <label for="sort-order" class="font-bold">Sort order:</label>
        <FormSelect
          v-model="searchParams.sortOrder"
          control-id="sort-order"
          :options="SortOrderOptions"
        />
      </FormBox>

      <!-- Loading message -->
      <p v-if="isLoading" class="mt-6 text-lg text-info">
        <span class="pr-2">
          <i class="fas fa-spinner fa-spin"></i>
        </span>
        <span>Loading users...</span>
      </p>

      <!-- No results found message -->
      <p v-else-if="data.users.length === 0" class="mt-6 text-lg text-warn">
        <span class="pr-2">
          <i class="fas fa-exclamation-triangle"></i>
        </span>
        <span> No users found matching your search criteria.</span>
      </p>

      <ul v-else>
        <UsersListItem
          v-for="user in data.users"
          :key="user.id"
          :user="user"
          @user-click="onUserClick"
        />

        <li class="text-center mt-2">
          <FormButton type="link" @click="onLoadMore">
            <span class="text-lg">Load more results...</span>
          </FormButton>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AdminSearchUsersParamsDTO,
  ProfileDTO,
  SortOrder,
  UserDTO,
  UserRole,
  UserSettingsDTO,
  UsersSortBy,
} from '@bottomtime/api';

import { onMounted, reactive, ref } from 'vue';

import { useClient } from '../../client';
import { SelectOption } from '../../common';
import { useOops } from '../../oops';
import DrawerPanel from '../common/drawer-panel.vue';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormTextBox from '../common/form-text-box.vue';
import ManageUser from './manage-user.vue';
import UsersListItem from './users-list-item.vue';

type UsersData = {
  users: UserDTO[];
  totalUsers: number;
};

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
  { label: 'Active', value: 'false' },
  { label: 'Suspended', value: 'true' },
];

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
const data = reactive<UsersData>({
  users: [],
  totalUsers: 0,
});
const isLoading = ref(true);
const selectedUser = ref<UserDTO | null>(null);

async function refreshUsers(): Promise<void> {
  const [sortBy, sortOrder] = searchParams.sortOrder.split('-');
  const params: AdminSearchUsersParamsDTO = {
    query: searchParams.query || undefined,
    role: searchParams.role || undefined,
    sortBy: sortBy as UsersSortBy,
    sortOrder: sortOrder as SortOrder,
    skip: 0,
    limit: 100,
  };

  isLoading.value = true;
  await oops(async () => {
    const response = await client.users.searchUsers(params);
    data.users = response.users.map((u) => u.toJSON());
    data.totalUsers = response.totalCount;
  });
  isLoading.value = false;
}

onMounted(refreshUsers);

function onUserClick(user: UserDTO): void {
  selectedUser.value = user;
}

function onCloseManageUser() {
  selectedUser.value = null;
}

function onLoadMore() {
  // TODO
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

function onSaveSettings(settings: UserSettingsDTO) {
  if (selectedUser.value) {
    selectedUser.value.settings = settings;
  }
}

function onSaveProfile(profile: ProfileDTO) {
  if (selectedUser.value) {
    selectedUser.value.profile = profile;
  }
}
</script>
