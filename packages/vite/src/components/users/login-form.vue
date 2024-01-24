<template>
  <form @submit.prevent="login">
    <div class="grid grid-cols-1 md:grid-cols-3">
      <div class="md:col-start-2 flex flex-col">
        <FormLabel label="Username or email" required />
        <FormTextBox v-model.trim="loginDetails.usernameOrEmail" />
        <FormLabel label="Password" required />
        <FormTextBox v-model.trim="loginDetails.password" password />
      </div>
    </div>
    <div class="flex flex-row justify-center gap-3 mt-2 mb-6">
      <FormButton type="primary" submit>Sign in</FormButton>
      <FormButton v-if="showCancel" @click="$emit('cancel')">Cancel</FormButton>
    </div>

    <hr />

    <div>
      <p class="m-6 text-center">
        Alternatively, you can sign in using one of these providers:
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3">
        <div class="md:col-start-2 flex flex-col gap-4">
          <a
            v-for="provider in oAuthProviders"
            :key="provider.name"
            :href="provider.url"
          >
            <FormButton stretch>
              <span>
                <i :class="provider.icon"></i>
                Sign in with {{ provider.name }}
              </span>
            </FormButton>
          </a>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { LoginParamsDTO } from '@bottomtime/api';
import { reactive } from 'vue';
import { useClient } from '../../client';
import { useCurrentUser } from '../../store';
import { useOops } from '../../oops';
import FormButton from '../common/form-button.vue';
import FormLabel from '../common/form-label.vue';
import FormTextBox from '../common/form-text-box.vue';

type LoginFormProps = {
  showCancel?: boolean;
};

type OAuthProvider = {
  name: string;
  url: string;
  icon: string;
};

const oAuthProviders: Readonly<OAuthProvider[]> = [
  {
    name: 'Google',
    url: 'https://google.com',
    icon: 'fab fa-google',
  },
  {
    name: 'Discord',
    url: 'https://discord.com',
    icon: 'fab fa-discord',
  },
  {
    name: 'Github',
    url: 'https://github.com',
    icon: 'fab fa-github',
  },
];

const currentUser = useCurrentUser();
const client = useClient();
const oops = useOops();

const loginDetails = reactive<LoginParamsDTO>({
  usernameOrEmail: '',
  password: '',
});

withDefaults(defineProps<LoginFormProps>(), {
  showCancel: true,
});

async function login() {
  await client.users.login(loginDetails.usernameOrEmail, loginDetails.password);
}

defineEmits<{
  (e: 'cancel'): void;
}>();
</script>
