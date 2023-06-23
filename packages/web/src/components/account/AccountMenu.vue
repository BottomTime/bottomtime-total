<template>
  <aside id="account-menu" class="menu box">
    <p class="menu-label">Account</p>
    <ul class="menu-list">
      <li>
        <RouterLink
          :class="{ 'is-active': currentRoute === 'accountMain' }"
          to="/account"
          >General</RouterLink
        >
      </li>
      <li>
        <RouterLink
          :class="{ 'is-active': currentRoute === 'accountChangePassword' }"
          to="/account/changePassword"
          >Change Password</RouterLink
        >
      </li>
      <li>
        <RouterLink
          :class="{ 'is-active': currentRoute === 'accountSettings' }"
          to="/account/settings"
          >Settings</RouterLink
        >
      </li>
    </ul>
  </aside>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import router from '@/router';

const currentRoute = computed(() => router.currentRoute.value.name);
</script>
