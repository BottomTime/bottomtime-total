<template>
  <!-- User is unauthenticated -->
  <div v-if="currentUser.user === null">
    <div class="grid grid-cols-1 md:grid-cols-5">
      <div class="md:col-start-2 md:col-span-3">
        <div class="flex flex-row gap-6 mb-6 justify-center">
          <span class="mt-2">
            <i class="fas fa-exclamation fa-2x text-warn"></i>
          </span>
          <div data-testid="require-auth-anonymous">
            <p class="mb-3">
              Sorry, but you must be logged in to view this page. Please enter
              your credentials below.
            </p>
            <p>
              If you don't have an account yet, you can
              <NavLink to="/register">register</NavLink> for one.
            </p>
          </div>
        </div>

        <FormBox>
          <LoginForm />
        </FormBox>
      </div>
    </div>
  </div>

  <!-- User is authenticated but not authorized -->
  <div v-else-if="!isAuthorized" data-testid="forbidden-message">
    <div class="grid grid-cols-1 md:grid-cols-5">
      <div class="md:col-start-2 md:col-span-3 p-3 rounded-md">
        <TextHeading>Unauthorized</TextHeading>
        <div class="flex flex-row gap-6 mb-6 justify-start">
          <span class="mt-2">
            <i class="fas fa-hand-paper fa-2x text-danger"></i>
          </span>
          <div data-testid="require-auth-unauthorized">
            <p class="mb-3">
              <strong>Stop!</strong> You are not authorized to view this page.
            </p>
            <p>
              You can return to the
              <NavLink to="/">home page</NavLink> or navigate to where you want
              to be using the nav bar at the top of the page.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- User is authenticated and authorized -->
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { UserRole } from '@bottomtime/api';

import { computed } from 'vue';

import { useCurrentUser } from '../../store';
import LoginForm from '../users/login-form.vue';
import FormBox from './form-box.vue';
import NavLink from './nav-link.vue';
import TextHeading from './text-heading.vue';

type RequireAuthProps = {
  role?: UserRole;
};

const currentUser = useCurrentUser();

const props = withDefaults(defineProps<RequireAuthProps>(), {
  role: UserRole.User,
});

const isAuthorized = computed<boolean>(() => {
  if (currentUser.user === null) {
    return false;
  }

  if (props.role === UserRole.Admin) {
    return currentUser.user.role === UserRole.Admin;
  }

  return true;
});
</script>
