<template>
  <MessageBox
    v-if="isSaved"
    title="Your Password Has Been Set"
    :style="MessageBoxStyle.Success"
  >
    <template #icon>
      <span class="icon is-large">
        <i class="fas fa-check fa-2x"></i>
      </span>
    </template>

    <template #default>
      <p class="content block">
        Your new password has been saved. You can now proceed to the
        <RouterLink to="/login">Login</RouterLink>
        page to log into your account.
      </p>
    </template>
  </MessageBox>

  <fieldset v-else-if="propsAreValid" :disabled="isSaving">
    <FormField label="New Password" control-id="newPassword" required>
      <TextBox
        id="newPassword"
        v-model="data.newPassword"
        :size="TextBoxSize.Normal"
        :errors="v$.newPassword.$errors"
        password
        autofocus
      />
    </FormField>

    <FormField label="Confirm Password" control-id="newPassword" required>
      <TextBox
        id="confirmPassword"
        v-model="data.confirmPassword"
        :size="TextBoxSize.Normal"
        :errors="v$.confirmPassword.$errors"
        password
      />
    </FormField>

    <div class="buttons is-centered">
      <button :class="buttonClasses" @click="createPassword">
        Create New Password
      </button>
    </div>
  </fieldset>

  <MessageBox
    v-else
    title="Unable To Create New Password"
    :style="MessageBoxStyle.Warning"
  >
    <template #icon>
      <span class="icon is-large">
        <i class="fas fa-exclamation fa-2x"></i>
      </span>
    </template>

    <template #default>
      <p class="content block">
        We're unable to create a new password for your account at this time. A
        username and password reset token must be provided.
      </p>
      <p class="content block">
        If you haven't done so already, request a password reset
        <RouterLink to="/resetPassword">here</RouterLink>. You will be emailed a
        link with a reset token that will allow you to create a new password.
      </p>
    </template>
  </MessageBox>
</template>

<script lang="ts" setup>
import { computed, defineProps, reactive, ref } from 'vue';
import { required, helpers } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';

import FormField from '../forms/FormField.vue';
import { inject } from '@/helpers';
import MessageBox from '../MessageBox.vue';
import TextBox from '../forms/TextBox.vue';
import {
  MessageBoxStyle,
  PasswordStrengthRegex,
  TextBoxSize,
  UsernameRegex,
} from '@/constants';
import { UserManagerKey, WithErrorHandlingKey } from '@/injection-keys';

interface CreateNewPasswordFormProps {
  username: string;
  token: string;
}

interface CreateNewPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

const userManager = inject(UserManagerKey);
const withErrorHandling = inject(WithErrorHandlingKey);

const props = defineProps<CreateNewPasswordFormProps>();
const data = reactive<CreateNewPasswordFormData>({
  newPassword: '',
  confirmPassword: '',
});
const isSaving = ref(false);
const isSaved = ref(false);
const buttonClasses = computed(() => ({
  button: true,
  'is-primary': true,
  'is-loading': isSaving.value,
}));

const propsAreValid = computed(
  () => UsernameRegex.test(props.username) && props.token.length > 0,
);

const validators = {
  newPassword: {
    required: helpers.withMessage('New password is required', required),
    strength: helpers.withMessage(
      'New password does not meet strength requirements',
      helpers.regex(PasswordStrengthRegex),
    ),
  },
  confirmPassword: {
    required: helpers.withMessage(
      'Please re-enter your new password',
      required,
    ),
    matches: helpers.withMessage(
      'Passwords do not match',
      (value) =>
        typeof value === 'string' &&
        (value.length === 0 || value === data.newPassword),
    ),
  },
};
const v$ = useVuelidate(validators, data);

async function createPassword() {
  const isValid = await v$.value.$validate();
  if (!isValid) return;

  isSaving.value = true;
  await withErrorHandling(async () => {
    await userManager.resetPassword(
      props.username,
      props.token,
      data.newPassword,
    );
    isSaved.value = true;
  });
  isSaving.value = false;
}
</script>
