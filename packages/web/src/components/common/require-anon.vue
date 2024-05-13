<template>
  <ConfirmDialog
    confirm-text="Logout"
    title="Logout?"
    :visible="showConfirmLogout"
    @cancel="onCancelLogout"
    @confirm="onConfirmLogout"
  >
    <div class="flex gap-3">
      <div class="mt-2">
        <span>
          <i class="fa-regular fa-circle-question fa-2x"></i>
        </span>
      </div>

      <div class="space-y-3">
        <p>
          Are you sure you want to log out? You will be redirected back to this
          page as an anonymous user.
        </p>
      </div>
    </div>
  </ConfirmDialog>
  <FormBox v-if="currentUser.user" class="flex gap-3">
    <span class="mt-3">
      <i class="fa-solid fa-circle-exclamation fa-3x"></i>
    </span>

    <div class="text-lg italic space-y-3">
      <p>
        You are currently already logged and this page is really only meant for
        users who are not yet signed in.
      </p>

      <p>
        You can return to the <NavLink to="/">home page</NavLink> or continue
        browsing.
      </p>

      <p>
        Alternatively, you can
        <FormButton size="lg" type="link" @click="onLogout">log out</FormButton>
        if you really mean to view this page.
      </p>
    </div>
  </FormBox>

  <slot v-else></slot>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { useLocation } from '../../location';
import { useCurrentUser } from '../../store';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import FormBox from './form-box.vue';
import FormButton from './form-button.vue';
import NavLink from './nav-link.vue';

const currentUser = useCurrentUser();
const location = useLocation();

const showConfirmLogout = ref(false);

function onLogout() {
  showConfirmLogout.value = true;
}

function onCancelLogout() {
  showConfirmLogout.value = false;
}

function onConfirmLogout() {
  location.assign(
    `/api/auth/logout?redirectTo=${encodeURIComponent('/resetPassword')}`,
  );
}
</script>
