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
              <RouterLink to="/register">register</RouterLink> for one.
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
  <ForbiddenMessage v-else-if="!isAuthorized" />

  <!-- User is authenticated and authorized -->
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { UserDTO, UserRole } from '@bottomtime/api';

import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { useCurrentUser } from '../../store';
import LoginForm from '../users/login-form.vue';
import ForbiddenMessage from './forbidden-message.vue';
import FormBox from './form-box.vue';

type RequireAuthProps = {
  role?: UserRole;
  authCheck?: (currentUser: UserDTO) => boolean;
};

const currentUser = useCurrentUser();

const props = withDefaults(defineProps<RequireAuthProps>(), {
  role: UserRole.User,
  authCheck: () => true,
});

const isAuthorized = computed<boolean>(() => {
  if (currentUser.user === null) {
    return false;
  }

  if (props.role === UserRole.Admin) {
    return currentUser.user.role === UserRole.Admin;
  }

  return props.authCheck(currentUser.user);
});
</script>
