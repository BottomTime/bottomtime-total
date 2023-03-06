<template>
  <div class="columns">
    <div class="column">
      <form @submit.prevent="onSubmit">
        <FormField label="Username or email" control-id="usernameOrEmail">
          <TextBox
            id="usernameOrEmail"
            autofocus
            v-model="v$.usernameOrEmail.$model"
            :errors="v$.usernameOrEmail.$errors"
          />
        </FormField>
        <FormField label="Password" required>
          <TextBox
            id="password"
            password
            v-model="v$.password.$model"
            :errors="v$.password.$errors"
          />
        </FormField>
        <div class="field is-grouped is-grouped-centered">
          <div class="control">
            <input type="submit" class="button is-primary" value="Login" />
          </div>
        </div>
      </form>
    </div>

    <div class="column">
      <div class="has-text-centered">
        <div class="block">
          <button class="button is-link">
            <span class="icon-text">
              <span class="icon">
                <i class="fab fa-google"></i>
              </span>
              <span>Login with Google</span>
            </span>
          </button>
        </div>

        <div class="block">
          <button class="button is-link">
            <span class="icon-text">
              <span class="icon">
                <i class="fab fa-github"></i>
              </span>
              <span>Login with Github</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { helpers, required } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';

import FormField from '@/components/forms/FormField.vue';
import { inject } from '@/helpers';
import TextBox from '@/components/forms/TextBox.vue';
import { UserManagerKey, WithErrorHandlingKey } from '@/injection-keys';

interface LoginFormData {
  usernameOrEmail: string;
  password: string;
}

const userManager = inject(UserManagerKey);
const withErrorHandling = inject(WithErrorHandlingKey);

const data = reactive<LoginFormData>({
  usernameOrEmail: '',
  password: '',
});
const validations = {
  usernameOrEmail: {
    required: helpers.withMessage('Username or email is required', required),
  },
  password: {
    required: helpers.withMessage('Password is required', required),
  },
};
const v$ = useVuelidate(validations, data);

async function onSubmit() {
  const isValid = await v$.value.$validate();
  // if (!isValid) return;

  await withErrorHandling(async () => {
    const user = await userManager.authenticateUser(
      data.usernameOrEmail,
      data.password,
    );
  });
}
</script>
