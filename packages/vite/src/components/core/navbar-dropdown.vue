<template>
  <div class="inline-block relative z-50">
    <button
      class="flex flex-row flex-nowrap justify-end items-center gap-3 text-lg hover:text-blue-300"
      @click="isActive = !isActive"
    >
      <UserAvatar
        :avatar="currentUser.user?.profile?.avatar"
        :display-name="currentUser.displayName"
      />
      <span class="text-lg">
        {{ currentUser.displayName }}
      </span>
      <span class="text-lg">
        <i class="fas fa-caret-down"></i>
      </span>
    </button>
    <ul
      v-if="isActive"
      class="absolute bg-gradient-to-b from-blue-800 to-blue-600 min-w-48 -right-3 rounded-b-md drop-shadow-lg opacity-100 text-left mt-4 z-40"
    >
      <li class="w-full p-2 hover:bg-blue-600">
        <a href="/profile">Profile</a>
      </li>
      <li class="w-full p-2 hover:bg-blue-600">
        <a href="/account">Account</a>
      </li>
      <hr />
      <li class="w-full p-2 hover:bg-blue-600 rounded-b-md">
        <a href="/api/auth/logout">Logout</a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { useCurrentUser } from '../../store';
import UserAvatar from '../users/user-avatar.vue';

const currentUser = useCurrentUser();
const isActive = ref(false);
</script>

<style scoped>
.nav-dropdown-leave-active,
.nav-dropdown-enter-active {
  transition: all 0.3s ease-out;
}

.nav-dropdown-enter-from,
.nav-dropdown-leave-to {
  transform: translateY(-100%);
}
</style>
