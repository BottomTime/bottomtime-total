<template>
  <li class="flex flex-row mt-2 gap-4">
    <!-- Avatar -->
    <div class="w-10 flex-initial mt-4">
      <UserAvatar :profile="user.profile" />
    </div>

    <!-- Info Panel -->
    <div class="grow">
      <div class="text-xl font-bold font-title">
        <FormButton
          class="m-0 p-0"
          type="link"
          :test-id="`userslist-link-${user.id}`"
          @click="$emit('user-click', user)"
        >
          <span class="text-xl font-bold">{{ user.username }}</span>
        </FormButton>
        <span v-if="user.profile?.name" class="ml-3">
          {{ user.profile?.name }}
        </span>
      </div>
      <div class="flex flex-row">
        <div class="grow">
          <!-- Email -->
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

          <!-- Location -->
          <p v-if="user.profile?.location">
            <span class="mr-1">
              <i class="fas fa-map-marker-alt fa-xs"></i>
            </span>
            <span>
              {{ user.profile?.location }}
            </span>
          </p>

          <!-- Member since -->
          <p>
            <span class="mr-1">
              <i class="fas fa-calendar-alt fa-xs"></i>
            </span>
            <span> Joined {{ dayjs(user.memberSince).fromNow() }} </span>
          </p>
        </div>

        <div class="grid grid-cols-2">
          <label class="text-right font-bold mr-2">Status:</label>
          <span :class="user.isLockedOut ? 'text-warn' : 'text-success'">
            {{ user.isLockedOut ? 'suspended' : 'active' }}
          </span>
          <label class="text-right font-bold mr-2">Role:</label>
          <span>{{ user.role }}</span>
          <label class="text-right font-bold mr-2">Password:</label>
          <span>{{ user.hasPassword ? 'set' : 'unset' }}</span>
        </div>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import { UserDTO } from '@bottomtime/api';

import dayjs from 'dayjs';
import 'dayjs/plugin/relativeTime';

import FormButton from '../common/form-button.vue';
import NavLink from '../common/nav-link.vue';
import UserAvatar from '../users/user-avatar.vue';

type UsersListItemProps = {
  user: UserDTO;
};

defineProps<UsersListItemProps>();

defineEmits<{
  (e: 'user-click', user: UserDTO): void;
}>();
</script>
