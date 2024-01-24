<template>
  <Transition name="hamburger">
    <ul
      v-if="visible"
      class="fixed top-16 w-full h-full z-40 flex flex-col gap-3 bg-blue-900 text-white outline-2 outline-black opacity-90 p-3"
    >
      <li v-for="link in getNavLinks(currentUser)" :key="link.url">
        <a :href="link.url" class="hover:text-blue-200">{{ link.title }}</a>
      </li>
    </ul>
  </Transition>
</template>

<script setup lang="ts">
import { getNavLinks } from './nav-links';
import { User } from '../../client/user';

type NavBarHamburgerProps = {
  visible: boolean;
  currentUser: User | null;
};

defineProps<NavBarHamburgerProps>();
</script>

<style scoped>
.hamburger-enter-active,
.hamburger-leave-active {
  transition: all 0.3s ease;
}

.hamburger-enter-from,
.hamburger-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.5s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
</style>
