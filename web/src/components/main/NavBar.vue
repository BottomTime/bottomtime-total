<template>
  <nav
    ref="navbar"
    class="navbar"
    role="navigation"
    aria-label="main navigation"
  >
    <div class="navbar-brand">
      <RouterLink class="navbar-item" to="/">
        <img
          src="https://bulma.io/images/bulma-logo.png"
          width="112"
          height="28"
        />
      </RouterLink>

      <a
        @click="dropdownExpanded = !dropdownExpanded"
        role="button"
        :class="{ 'navbar-burger': true, 'is-active': dropdownExpanded }"
        aria-label="menu"
        :aria-expanded="dropdownExpanded"
        data-target="nav-main-menu"
      >
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div
      id="nav-main-menu"
      :class="{ 'navbar-menu': true, 'is-active': dropdownExpanded }"
    >
      <div class="navbar-start">
        <RouterLink class="navbar-item" to="/">Home</RouterLink>
      </div>

      <div class="navbar-end">
        <RouterLink class="navbar-item" to="/signup">Sign Up</RouterLink>
        <RouterLink class="navbar-item" to="/login">
          <button class="button is-primary">Login</button>
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { ref, onBeforeMount, onUnmounted } from 'vue';
import router from '@/router';

const dropdownExpanded = ref(false);
const navbar = ref<HTMLDivElement>();

// Close dropdown on navigation
router.beforeEach(() => {
  dropdownExpanded.value = false;
});

// Close dropdown if page is clicked outside of navbar
function onClickOutside(event: MouseEvent) {
  if (
    dropdownExpanded.value &&
    event.target !== navbar.value &&
    !navbar.value?.contains(event.target as Node)
  ) {
    dropdownExpanded.value = false;
  }
}

onBeforeMount(() => {
  document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
});
</script>
