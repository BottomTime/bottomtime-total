<template>
  <DrawerPanel
    :title="selectedUser?.username"
    :visible="!!selectedUser"
    @close="onCloseManageUser"
  >
    <ManageUser v-if="selectedUser" :user="selectedUser" />
  </DrawerPanel>
  <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
    <!-- Search criteria panel -->
    <FormBox class="lg:col-start-2">
      <form class="flex flex-col sticky top-20" @submit.prevent="">
        <div class="relative mb-3">
          <span
            class="absolute pointer-events-none right-3 top-1.5 dark:text-grey-950"
          >
            <i class="fas fa-search"></i>
          </span>
          <FormTextBox
            v-model="searchParams.query"
            control-id="search"
            :maxlength="200"
            placeholder="Search users"
            test-id="search-users"
          />
        </div>
        <FormField label="Filter by role" control-id="role">
          <FormSelect
            v-model="searchParams.role"
            control-id="role"
            :options="UserRoleOptions"
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

    <div class="md:col-span-3">
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
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AdminSearchUsersParamsDTO,
  SortOrder,
  UserDTO,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';

import { onMounted, reactive, ref } from 'vue';

import { User, useClient } from '../../client';
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
  users: User[];
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
const client = useClient();
const oops = useOops();

const searchParams = reactive<{
  query: string;
  role: UserRole | '';
  sortOrder: string;
}>({
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
    limit: 100,
  };

  isLoading.value = true;
  await oops(async () => {
    const response = await client.users.searchUsers(params);
    data.users = response.users;
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
</script>
