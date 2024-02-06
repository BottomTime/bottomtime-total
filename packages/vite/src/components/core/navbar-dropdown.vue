<template>
  <div
    v-click-outside="onClickOutside"
    class="inline-block relative bg-blue-900 h-8"
  >
    <button
      data-testid="nav-dropdown-button"
      class="flex flex-row flex-nowrap justify-end items-baseline gap-3 text-lg hover:text-blue-300"
      @click="isActive = !isActive"
    >
      <UserAvatar
        class="absolute -left-10 -top-0.5"
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
    <Transition name="nav-dropdown">
      <div
        v-if="isActive"
        class="absolute flex flex-col bg-gradient-to-b from-blue-900 to-blue-500 min-w-48 -right-3 rounded-b-md drop-shadow-lg opacity-100 text-left top-11"
      >
        <a class="w-full p-2 hover:bg-blue-600" href="/profile">Profile</a>
        <a class="w-full p-2 hover:bg-blue-600" href="/account">Account</a>
        <hr />
        <a
          class="w-full p-2 rounded-b-md hover:bg-blue-600"
          href="/api/auth/logout"
          >Logout</a
        >
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { useCurrentUser } from '../../store';
import UserAvatar from '../users/user-avatar.vue';

const currentUser = useCurrentUser();
const isActive = ref(false);

function onClickOutside() {
  isActive.value = false;
}
</script>

<style scoped>
.nav-dropdown-leave-active,
.nav-dropdown-enter-active {
  transition: all 0.2s ease-out;
}

.nav-dropdown-enter-from,
.nav-dropdown-leave-to {
  opacity: 0;
}
</style>
