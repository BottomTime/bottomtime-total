<template>
  <slot v-if="state === AuthState.Authorized"></slot>

  <ForbiddenMessage v-else-if="state === AuthState.Forbidden" />

  <div v-else class="grid grid-cols-1 md:grid-cols-5">
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
</template>

<script lang="ts" setup>
import { UserDTO, UserRole } from '@bottomtime/api';

import { computed } from 'vue';

import { useCurrentUser } from '../../store';
import LoginForm from '../users/login-form.vue';
import ForbiddenMessage from './forbidden-message.vue';
import FormBox from './form-box.vue';
import NavLink from './nav-link.vue';

type AuthorizerFn = (currentUser: UserDTO | null) => boolean;

enum AuthState {
  Authorized,
  Unauthorized,
  Forbidden,
}

interface RequireAuthProps {
  authorizer?: boolean | AuthorizerFn;
}

const currentUser = useCurrentUser();

const props = withDefaults(defineProps<RequireAuthProps>(), {
  authorizer: (user: UserDTO | null) => !!user,
});
const state = computed<AuthState>(() => {
  if (currentUser.user?.role === UserRole.Admin) return AuthState.Authorized;

  const authorized =
    typeof props.authorizer === 'boolean'
      ? props.authorizer
      : props.authorizer(currentUser.user);

  if (authorized) return AuthState.Authorized;
  else if (currentUser.user) return AuthState.Forbidden;
  else return AuthState.Unauthorized;
});
</script>
