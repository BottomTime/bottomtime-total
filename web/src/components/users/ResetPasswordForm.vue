<template>
  <article
    v-if="isRequested"
    id="msg-request-submitted"
    class="message is-success"
  >
    <div class="message-header">
      <p>Request Has Been Sent</p>
    </div>
    <div class="message-body">
      <p class="content block">
        Your request to have your password reset has been received. If we are
        able to find a user account matching the username or email that you
        entered, then we will send you an email with a link to reset your
        password.
      </p>
      <p class="content block">
        Please allow a few moments for the message to be delivered to your
        inbox. Don't forget to check your spam folder if you don't see it after
        a minute or two!
      </p>
      <p class="content block">
        If after a few moments you still haven't received the email then it's
        possible the username or email address you entered was incorrect or
        contained a typo. Please click
        <a id="btn-reset-form" @click="resetForm">here</a> to try again.
      </p>
    </div>
  </article>
  <fieldset v-else class="box" :disabled="isRequesting">
    <FormField label="Username or email" control-id="usernameOrEmail" required>
      <TextBox
        id="usernameOrEmail"
        :maxlength="50"
        v-model="data.usernameOrEmail"
        :errors="v$.usernameOrEmail.$errors"
        autofocus
      />
    </FormField>

    <div class="buttons is-centered">
      <button
        id="btn-submit-reset-request"
        :class="buttonClasses"
        @click="resetPassword"
        :disabled="isRequesting"
      >
        Reset!
      </button>
    </div>
  </fieldset>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { email, helpers, or, required } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';

import FormField from '../forms/FormField.vue';
import { inject } from '@/helpers';
import TextBox from '../forms/TextBox.vue';
import { UserManagerKey, WithErrorHandlingKey } from '@/injection-keys';
import { UsernameRegex } from '@/constants';

interface ResetPasswordFormData {
  usernameOrEmail: string;
}

const userManager = inject(UserManagerKey);
const withErrorHandling = inject(WithErrorHandlingKey);

const data = reactive<ResetPasswordFormData>({
  usernameOrEmail: '',
});
const isRequesting = ref(false);
const isRequested = ref(false);
const buttonClasses = computed(() => ({
  button: true,
  'is-primary': true,
  'is-loading': isRequesting.value,
}));

const validations = {
  usernameOrEmail: {
    required: helpers.withMessage('Username or email is required', required),
    valid: helpers.withMessage(
      'Must be a valid username or email address',
      or(email, helpers.regex(UsernameRegex)),
    ),
  },
};
const v$ = useVuelidate(validations, data);

async function resetPassword() {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  isRequesting.value = true;
  await withErrorHandling(async () => {
    await userManager.requestPasswordReset(data.usernameOrEmail);
    isRequested.value = true;
  });
  isRequesting.value = false;
}

function resetForm() {
  data.usernameOrEmail = '';
  isRequested.value = false;
  isRequesting.value = false;
  v$.value.$reset();
}
</script>
