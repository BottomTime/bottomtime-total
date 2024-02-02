<template>
  <div>Users List</div>
  <p>Total Users: {{ data.totalUsers }}</p>
  <ul>
    <li v-for="user in data.users" :key="user.id">
      {{ user.username }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { UserDTO } from '@bottomtime/api';

import { onMounted, reactive } from 'vue';

import { useClient } from '../../client';
import { useOops } from '../../oops';

type UsersData = {
  users: UserDTO[];
  totalUsers: number;
};

const client = useClient();
const oops = useOops();

const data = reactive<UsersData>({
  users: [],
  totalUsers: 0,
});

async function refreshUsers(): Promise<void> {
  await oops(async () => {
    const response = await client.users.searchUsers();
    data.users = response.users.map((user) => user.toJSON());
    data.totalUsers = response.totalCount;
    console.log(data);
  });
}

onMounted(refreshUsers);
</script>
