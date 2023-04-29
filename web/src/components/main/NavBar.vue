<template>
  <nav
    ref="navbar"
    class="navbar"
    role="navigation"
    aria-label="main navigation"
  >
    <div class="container">
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
          :class="`navbar-burger${dropdownExpanded ? ' is-active' : ''}`"
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
          <RouterLink v-if="isAdmin" class="navbar-item" to="/manageUsers">
            Manage Users
          </RouterLink>
        </div>

        <div v-if="currentUser" class="navbar-end">
          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link">{{ displayName }}</a>

            <div class="navbar-dropdown">
              <RouterLink to="/profile" class="navbar-item">Profile</RouterLink>
              <hr class="navbar-divider" />
              <RouterLink to="/account" class="navbar-item"
                >Manage Account</RouterLink
              >
              <RouterLink to="/account/changePassword" class="navbar-item"
                >Change Password</RouterLink
              >
              <RouterLink to="/account/settings" class="navbar-item"
                >Settings</RouterLink
              >
              <hr class="navbar-divider" />
              <a href="/api/auth/logout" class="navbar-item">Logout</a>
            </div>
          </div>
        </div>

        <div v-else class="navbar-end">
          <RouterLink class="navbar-item" to="/signup">Sign Up</RouterLink>
          <RouterLink class="navbar-item" to="/login">
            <button class="button is-primary">Login</button>
          </RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed, ref, onBeforeMount, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '@/store';
import { UserRole } from '@/constants';

const dropdownExpanded = ref(false);
const navbar = ref<HTMLDivElement>();
const router = useRouter();
const store = useStore();

const currentUser = computed(() => store.state.currentUser);
const displayName = computed(() => store.getters.userDisplayName);
const isAdmin = computed(() => currentUser.value?.role ?? 0 >= UserRole.Admin);

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
