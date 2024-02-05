<template>
  <li class="flex flex-row mt-2 gap-4">
    <div class="mt-4">
      <UserAvatar
        :avatar="user.profile?.avatar"
        :display-name="user.profile?.name || user.username"
      />
    </div>
    <div class="grow flex flex-col">
      <div class="text-xl font-bold font-title">
        <FormButton type="link" @click="$emit('user-click', user)">
          <span class="text-xl font-bold">{{ user.username }}</span>
        </FormButton>
        <span v-if="user.profile?.name">{{ user.profile?.name }}</span>
      </div>
      <p>{{ user.profile?.name }}</p>
      <p>{{ user.profile?.location }}</p>
      <p>Joined {{ dayjs(user.memberSince).fromNow() }}</p>
      <p>{{ user.role }}</p>
      <p>
        <NavLink :to="`mailto:${user.email}`">
          <span class="mr-1">
            <i class="fas fa-envelope fa-xs"></i>
          </span>
          <span>
            {{ user.email }}
          </span>
        </NavLink>
      </p>
    </div>

    <div>Other options here.</div>
  </li>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';

import { User } from '../../client';
import FormButton from '../common/form-button.vue';
import NavLink from '../common/nav-link.vue';
import UserAvatar from '../users/user-avatar.vue';

type UsersListItemProps = {
  user: User;
};

defineProps<UsersListItemProps>();

defineEmits<{
  (e: 'user-click', user: User): void;
}>();
</script>
