<template>
  <DrawerPanel title="Login" :visible="showLogin" @close="toggleLoginForm">
    <LoginForm ref="loginForm" @close="toggleLoginForm" />
  </DrawerPanel>
  <section class="h-16">
    <nav
      class="fixed top-0 w-full font-content bg-blue-900 text-blue-200 shadow-md shadow-blue-500"
    >
      <div
        class="container p-2 mx-auto h-16 flex flex-row flex-nowrap items-center justify-stretch"
      >
        <!-- Brand Logo -->
        <div class="h-8 w-40 mr-4 md:flex-none grow">
          <div class="flex flex-row flex-nowrap justify-end items-center gap-3">
            <button
              class="md:hidden visible pr-2"
              role="navigation"
              @click="showHamburger = !showHamburger"
            >
              <i class="fas fa-bars"></i>
            </button>
            <span class="font-bold text-red text-2xl">
              <a href="/">Bottom Time</a>
            </span>
          </div>
        </div>

        <!-- Collapsable Links (collapse to hamburger menu on small screens) -->
        <div class="grow h-8 hidden md:block">
          <ul
            class="flex flex-row flex-nowrap justify-start items-center gap-4"
          >
            <NavBarLink
              v-for="link in getNavLinks(currentUser.user)"
              :key="link.url"
              :to="link.url"
              :title="link.title"
            />
          </ul>
        </div>

        <!-- Right-Hand Dropdown (always visible) -->
        <div class="h-8 flex-initial text-right">
          <ul
            v-if="currentUser.anonymous"
            class="flex flex-row flex-nowrap justify-end items-start gap-3"
          >
            <NavBarLink to="/register" title="Register" />
            <li>
              <FormButton type="primary" @click="toggleLoginForm">
                Sign in
              </FormButton>
            </li>
          </ul>

          <NavbarDropdown v-else />
        </div>
      </div>
    </nav>
    <NavbarHamburger
      :visible="showHamburger"
      :current-user="currentUser.user"
    />
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import DrawerPanel from '../common/drawer-panel.vue';
import { getNavLinks } from './nav-links';
import FormButton from '../common/form-button.vue';
import LoginForm from '../users/login-form.vue';
import NavbarDropdown from './navbar-dropdown.vue';
import NavBarLink from './nav-bar-link.vue';
import NavbarHamburger from './nav-bar-hamburger.vue';
import { useCurrentUser } from '../../store';
import UserAvatar from '../users/user-avatar.vue';

const showLogin = ref(false);
const showHamburger = ref(false);
const loginForm = ref<InstanceType<typeof LoginForm> | null>();

const currentUser = useCurrentUser();

async function toggleLoginForm() {
  if (!showLogin.value) {
    loginForm.value?.reset(true);
  }

  showLogin.value = !showLogin.value;
  await nextTick();

  if (showLogin.value) {
    loginForm.value?.focusUsername();
  }
}
</script>
