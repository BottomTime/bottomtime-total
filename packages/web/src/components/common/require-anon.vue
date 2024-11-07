<template>
  <ConfirmDialog
    confirm-text="Logout"
    title="Logout?"
    icon="fa-regular fa-circle-question fa-2x"
    :visible="showConfirmLogout"
    @cancel="onCancelLogout"
    @confirm="onConfirmLogout"
  >
    <p>
      Are you sure you want to log out? You will be redirected back to this page
      as an anonymous user.
    </p>
  </ConfirmDialog>

  <FormBox
    v-if="currentUser.user"
    class="flex gap-3"
    data-testid="auth-content"
  >
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
        <FormButton
          size="lg"
          type="link"
          test-id="logout-link"
          @click="onLogout"
        >
          log out
        </FormButton>
        if you really mean to view this page.
      </p>
    </div>
  </FormBox>

  <slot v-else></slot>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useClient } from '../../api-client';
import { useOops } from '../../oops';
import { useCurrentUser } from '../../store';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import FormBox from './form-box.vue';
import FormButton from './form-button.vue';
import NavLink from './nav-link.vue';

interface RequireAnonProps {
  redirectTo?: string;
}

const client = useClient();
const currentUser = useCurrentUser();
const oops = useOops();
const route = useRoute();
const router = useRouter();

const props = defineProps<RequireAnonProps>();
const showConfirmLogout = ref(false);

function onLogout() {
  showConfirmLogout.value = true;
}

function onCancelLogout() {
  showConfirmLogout.value = false;
}

async function onConfirmLogout() {
  await oops(async () => {
    await client.users.logout();
    currentUser.user = null;
    const redirectTo = props.redirectTo?.startsWith('/')
      ? props.redirectTo
      : route.path;
    await router.push({ path: redirectTo });
  });
}
</script>
