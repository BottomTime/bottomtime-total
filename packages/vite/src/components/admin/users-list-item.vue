<template>
  <li class="flex flex-row mt-2 gap-4">
    <div class="w-10 flex-initial mt-4">
      <UserAvatar
        :avatar="user.profile?.avatar"
        :display-name="user.profile?.name || user.username"
      />
    </div>
    <div class="grow">
      <div class="text-xl font-bold font-title">
        <FormButton
          class="m-0 p-0"
          type="link"
          @click="$emit('user-click', user)"
        >
          <span class="text-xl font-bold">{{ user.username }}</span>
        </FormButton>
        <span v-if="user.profile?.name" class="ml-3">{{
          user.profile?.name
        }}</span>
      </div>
      <div class="flex flex-row">
        <div class="grow">
          <p v-if="user.profile?.location">{{ user.profile?.location }}</p>
          <p>Joined {{ dayjs(user.memberSince).fromNow() }}</p>
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
      </div>
    </div>
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
