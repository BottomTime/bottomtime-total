<template>
  <DrawerPanel title="Login" :visible="showLogin" @close="showLogin = false">
    <p>Lol</p>
  </DrawerPanel>
  <section class="h-16">
    <div
      class="absolute top-0 w-full font-content bg-blue-900 text-blue-200 rounded-b-lg opacity-90 shadow-md shadow-blue-500"
    >
      <div
        class="container p-3 mx-auto h-16 flex flex-row items-baseline content-center justify-stretch"
      >
        <!-- Brand Logo -->
        <div
          class="h-12 w-40 flex-none text-2xl font-bold text-red drop-shadow-md"
        >
          <a href="/">Bottom Time</a>
        </div>

        <!-- Collapsable Links (collapse to hamburger menu on small screens) -->
        <div class="grow">
          <ul class="flex flex-row flex-nowrap justify-start items-start gap-6">
            <NavBarLink to="/" title="Home" />
            <NavBarLink to="/about" title="About" />
          </ul>
        </div>

        <!-- Right-Hand Dropdown (always visible) -->
        <div class="p-1 h-12 w-44 flex-none text-right">
          <ul
            v-if="store.currentUser.anonymous"
            class="flex flex-row flex-nowrap justify-start items-start gap-3"
          >
            <NavBarLink to="/register" title="Register" />
            <li>
              <FormButton :type="ButtonType.Primary" @click="showLogin = true">
                Sign in
              </FormButton>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ButtonType } from '../../common';
import DrawerPanel from '../common/drawer-panel.vue';
import FormButton from '../common/form-button.vue';
import NavBarLink from './nav-bar-link.vue';
import { useCurrentUser } from '../../store';

const showLogin = ref(false);

const store = useCurrentUser();
</script>
