<template>
  <DrawerPanel title="Login" :visible="showLogin" @close="toggleLoginForm">
    <div class="grid grid-cols-1 xl:grid-cols-6">
      <div class="xl:col-start-2 xl:col-span-4">
        <LoginForm ref="loginForm" @close="toggleLoginForm" />
      </div>
    </div>
  </DrawerPanel>

  <section class="h-16">
    <nav
      class="fixed top-0 w-full font-content bg-blue-900 text-blue-200 shadow-md shadow-blue-500 z-[40]"
    >
      <div
        class="container px-3 mx-auto h-16 flex flex-row flex-nowrap place-items-center justify-between"
      >
        <!-- Brand Logo -->
        <a
          href="/"
          class="flex flex-initial items-center space-x-3 no-underline font-title"
        >
          <img
            src="/img/flag-logo.png"
            alt="logo"
            class="w-12 h-8 rounded-md shadow-sm shadow-danger"
          />
          <span class="text-red hover:text-danger-dark text-2xl">
            {{ appTitle }}
          </span>
        </a>

        <!-- Right-Hand Dropdown (always visible) -->
        <div class="flex items-center space-x-0 md:order-2 md:space-x-3">
          <DarkModeToggle />

          <!-- Login/register links for anonymous users -->
          <ul
            v-if="currentUser.anonymous"
            class="hidden md:flex flex-row ml-4 gap-3 justify-end items-baseline"
          >
            <NavBarLink to="/register" title="Register" />
            <li>
              <FormButton
                type="primary"
                test-id="login-button"
                @click="toggleLoginForm"
              >
                Sign in
              </FormButton>
            </li>
          </ul>

          <!-- Notifications alert -->
          <NotificationsBell v-if="notificationsEnabled.value" />

          <!-- Avatar for authenticated users -->
          <button
            v-if="currentUser.user"
            id="user-menu-button"
            v-click-outside="() => (showUserDropdown = false)"
            data-testid="user-menu-button"
            class="flex items-center space-x-3 relative h-16"
            :aria-expanded="showUserDropdown"
            @click="showUserDropdown = !showUserDropdown"
          >
            <span class="sr-only">Open User Menu</span>
            <UserAvatar
              :avatar="currentUser.user?.profile?.avatar ?? undefined"
              :display-name="currentUser.displayName"
            />
            <span class="text-lg hidden md:block">
              {{ currentUser.displayName }}
            </span>
            <span class="text-lg hidden md:block">
              <i class="fas fa-caret-down"></i>
            </span>

            <!-- User Dropdown Menu -->
            <Transition name="nav-dropdown">
              <div
                v-show="showUserDropdown"
                id="user-dropdown"
                data-testid="user-dropdown"
                class="flex flex-col absolute min-w-48 top-16 right-1 bg-gradient-to-b from-blue-900 to-blue-950 rounded-b-md drop-shadow-lg text-left z-[42]"
              >
                <a
                  class="w-full p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700"
                  href="/friends"
                >
                  Friends
                </a>
                <a
                  v-if="currentUser.user?.accountTier >= AccountTier.ShopOwner"
                  class="w-full p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700"
                  :href="`/shops?owner=${currentUser.user?.username}`"
                >
                  My Dive Shops
                </a>
                <hr />
                <a
                  class="w-full p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700"
                  href="/profile"
                >
                  Profile
                </a>
                <a
                  class="w-full p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700"
                  href="/account"
                >
                  Account
                </a>
                <a
                  class="w-full p-2 text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700"
                  href="/settings"
                >
                  Settings
                </a>
                <hr />
                <a
                  class="w-full p-2 rounded-b-md text-grey-300 hover:text-grey-50 no-underline hover:bg-blue-700"
                  @click="onLogout"
                >
                  Logout
                </a>
              </div>
            </Transition>
          </button>

          <button
            v-click-outside="() => (showHamburger = false)"
            class="inline-flex items-center p-2 w-10 h-10 justify-center rounded-lg md:hidden"
            data-testid="hamburger-button"
            aria-controls="navbar-user"
            :aria-expanded="showHamburger"
            @click="showHamburger = !showHamburger"
          >
            <span class="sr-only">Open Main Menu</span>
            <span aria-hidden="true">
              <i class="fas fa-bars"></i>
            </span>
          </button>
        </div>

        <!-- Collapsable Links (collapse to hamburger menu on small screens) -->
        <div
          id="navbar-user"
          :class="`items-center justify-between grow w-full md:w-auto px-0 md:px-4 md:flex md:order-1 fixed top-16 left-0 md:static ${
            !showHamburger && 'hidden'
          }`"
          data-testid="hamburger-menu"
        >
          <ul
            class="flex flex-col space-x-0 md:flex-row md:space-x-4 p-2 w-full md:w-auto bg-blue-900 outline-black rounded-b-md"
          >
            <NavBarLink
              v-for="link in navLinks.filter((l) => l.visible)"
              :key="link.url"
              :to="link.url"
              :title="link.title"
            />
            <hr
              v-if="currentUser.anonymous"
              class="block md:hidden my-2 align-middle"
            />
            <NavBarLink
              v-if="currentUser.anonymous"
              class="block md:hidden"
              test-id="login-link"
              to="#"
              title="Login"
              @click="toggleLoginForm"
            />
            <NavBarLink
              v-if="currentUser.anonymous"
              class="block md:hidden"
              to="/register"
              title="Register"
            />
          </ul>
        </div>
      </div>
    </nav>
  </section>
</template>

<script setup lang="ts">
import { AccountTier, UserRole } from '@bottomtime/api';
import { NotificationsFeature } from '@bottomtime/common';

import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { Config } from '../../config';
import { useFeature } from '../../featrues';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';
import DrawerPanel from '../common/drawer-panel.vue';
import FormButton from '../common/form-button.vue';
import LoginForm from '../users/login-form.vue';
import UserAvatar from '../users/user-avatar.vue';
import DarkModeToggle from './dark-mode-toggle.vue';
import NavBarLink from './nav-bar-link.vue';
import NotificationsBell from './notifications-bell.vue';

type NavLink = {
  title: string;
  url: string;
  visible: boolean;
};

const client = useClient();
const oops = useOops();
const router = useRouter();

const currentUser = useCurrentUser();
const notificationsEnabled = useFeature(NotificationsFeature);

const showLogin = ref(false);
const showHamburger = ref(false);
const showUserDropdown = ref(false);
const loginForm = ref<InstanceType<typeof LoginForm> | null>();
const appTitle = computed(() => Config.appTitle);
const navLinks = computed<NavLink[]>(() => {
  return [
    {
      title: 'Home',
      url: '/',
      visible: true,
    },
    {
      title: 'Log Book',
      url: `/logbook/${currentUser.user?.username}`,
      visible: !currentUser.anonymous,
    },
    {
      title: 'Dive Sites',
      url: '/diveSites',
      visible: true,
    },
    {
      title: 'Dive Shops',
      url: '/shops',
      visible: true,
    },
    {
      title: 'Admin',
      url: '/admin',
      visible: currentUser.user?.role === UserRole.Admin,
    },
  ];
});

async function toggleLoginForm() {
  if (!showLogin.value) {
    loginForm.value?.reset(true);
    showHamburger.value = false;
  }

  showLogin.value = !showLogin.value;
  await nextTick();

  if (showLogin.value) {
    loginForm.value?.focusUsername();
  }
}

async function onLogout(): Promise<void> {
  await oops(async () => {
    await client.users.logout();
    currentUser.user = null;
    await router.push('/');
  });
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
