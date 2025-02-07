<template>
  <!-- Username -->
  <FormField label="Username">
    <fieldset
      class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline"
      :disabled="state.isSavingUsername"
    >
      <div class="grow w-full">
        <div v-if="state.isEditingUsername" class="flex flex-col gap-2">
          <FormTextBox
            ref="usernameInput"
            v-model.trim="username"
            control-id="username"
            test-id="username"
            select-on-focus
            :invalid="vUsername$?.username?.$error"
            :maxlength="50"
            autofocus
            stretch
            @enter="onConfirmChangeUsername"
            @esc="onCancelChangeUsername"
          />
          <span
            v-if="vUsername$?.username?.$error"
            data-testid="username-error"
            class="text-danger text-sm"
          >
            {{ vUsername$?.username?.$errors[0]?.$message }}
          </span>
        </div>
        <span v-else data-testid="username-value">
          {{ user.username }}
        </span>
      </div>

      <div class="min-w-36 lg:min-w-40 xl:min-w-48">
        <div
          v-if="state.isEditingUsername"
          class="flex flex-row gap-2 justify-stretch"
        >
          <FormButton
            type="primary"
            test-id="save-username"
            :is-loading="state.isSavingUsername"
            stretch
            @click="onConfirmChangeUsername"
          >
            Save
          </FormButton>
          <FormButton
            test-id="cancel-username"
            stretch
            @click="onCancelChangeUsername"
          >
            Cancel
          </FormButton>
        </div>

        <FormButton
          v-else
          test-id="edit-username"
          stretch
          @click="onChangeUsername"
        >
          Change username...
        </FormButton>
      </div>
    </fieldset>
  </FormField>

  <!-- Email -->
  <FormField label="Email address">
    <fieldset
      class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline"
      :disabled="state.isSavingEmail"
    >
      <div class="grow w-full">
        <div v-if="state.isEditingEmail" class="flex flex-col gap-2">
          <FormTextBox
            ref="emailInput"
            v-model.trim="email"
            control-id="email"
            test-id="email"
            select-on-focus
            :invalid="vEmail$?.email?.$error"
            :maxlength="50"
            autofocus
            stretch
            @enter="onConfirmChangeEmail"
            @esc="onCancelChangeEmail"
          />
          <span
            v-if="vEmail$?.email?.$error"
            data-testid="email-error"
            class="text-danger text-sm"
          >
            {{ vEmail$?.email?.$errors[0]?.$message }}
          </span>
        </div>

        <span v-else data-testid="email-value">
          {{ user.email || 'No email address set' }}
        </span>
      </div>

      <div class="min-w-36 lg:min-w-40 xl:min-w-48">
        <div
          v-if="state.isEditingEmail"
          class="flex flex-row gap-2 justify-stretch"
        >
          <FormButton
            type="primary"
            test-id="save-email"
            :is-loading="state.isSavingEmail"
            stretch
            @click="onConfirmChangeEmail"
          >
            Save
          </FormButton>
          <FormButton
            stretch
            test-id="cancel-email"
            @click="onCancelChangeEmail"
          >
            Cancel
          </FormButton>
        </div>

        <FormButton v-else test-id="edit-email" stretch @click="onChangeEmail">
          Change email...
        </FormButton>
      </div>
    </fieldset>
  </FormField>

  <!-- Email verification -->
  <FormField v-if="user.email">
    <div class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline">
      <div class="grow w-full" data-testid="email-verification-status">
        <span
          v-if="state.verificationEmail === VerificationEmailState.Verified"
          class="text-success"
        >
          <span class="mr-2">
            <i class="fas fa-check"></i>
          </span>
          <span class="italic text-sm">Email address is verified</span>
        </span>

        <div
          v-else-if="state.verificationEmail === VerificationEmailState.Sent"
          class="text-success flex flex-row gap-3"
        >
          <span class="flex-initial">
            <i class="fas fa-envelope fa-lg"></i>
          </span>
          <div class="grow flex flex-col gap-4 italic text-sm">
            <p>
              A verification email has been sent to your email address. It will
              contain a link to verify your email address.
            </p>
            <p>
              <strong>NOTE:</strong> It may take several minutes to arrive in
              your inbox. If you do not receive the email, please check your
              spam folder and, if you have still not received the message after
              several minutes, you can try refreshing this page and requesting
              another email.
            </p>
          </div>
        </div>

        <span v-else class="text-warn">
          <span class="mr-2">
            <i class="fas fa-exclamation-triangle"></i>
          </span>
          <span class="italic text-sm"
            >Email address has not been verified</span
          >
        </span>
      </div>

      <div
        v-if="
          state.verificationEmail === VerificationEmailState.NotSent ||
          state.verificationEmail === VerificationEmailState.Sending
        "
        class="min-w-36 lg:min-w-40 xl:min-w-48"
      >
        <FormButton
          stretch
          test-id="send-verification-email"
          :is-loading="
            state.verificationEmail === VerificationEmailState.Sending
          "
          @click="onSendVerificationEmail"
        >
          Send verification email
        </FormButton>
      </div>
    </div>
  </FormField>
</template>

<script setup lang="ts">
import { UserDTO, UsernameRegex } from '@bottomtime/api';

import { useVuelidate } from '@vuelidate/core';
import { helpers, required, email as validEmail } from '@vuelidate/validators';

import { nextTick, reactive, ref } from 'vue';

import { useClient } from '../../api-client';
import { ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';

enum VerificationEmailState {
  NotSent,
  Sending,
  Sent,
  Verified,
}

type UsernameAndEmailProps = {
  user: UserDTO;
};
type UsernameAndEmailState = {
  isEditingUsername: boolean;
  isSavingUsername: boolean;
  isEditingEmail: boolean;
  isSavingEmail: boolean;
  isSendingVerificationEmail: boolean;
  verificationEmail: VerificationEmailState;
};

const client = useClient();
const oops = useOops();
const toasts = useToasts();

const props = defineProps<UsernameAndEmailProps>();
const state = reactive<UsernameAndEmailState>({
  isEditingUsername: false,
  isSavingUsername: false,
  isEditingEmail: false,
  isSavingEmail: false,
  isSendingVerificationEmail: false,
  verificationEmail: props.user.emailVerified
    ? VerificationEmailState.Verified
    : VerificationEmailState.NotSent,
});
const emit = defineEmits<{
  (e: 'change-username', username: string): void;
  (e: 'change-email', email: string): void;
}>();

const username = ref('');
const usernameInput = ref<InstanceType<typeof FormTextBox> | null>(null);
const email = ref('');
const emailInput = ref<InstanceType<typeof FormTextBox> | null>(null);

const vUsername$ = useVuelidate(
  {
    username: {
      required: helpers.withMessage('New username is required', required),
      regex: helpers.withMessage(
        'Username must be at least 3 characters and contain only letters, numbers, dashes, dots, and underscores',
        helpers.regex(UsernameRegex),
      ),
    },
  },
  { username },
);

const vEmail$ = useVuelidate(
  {
    email: {
      required: helpers.withMessage('New email address is required', required),
      email: helpers.withMessage('Must be a valid email address', validEmail),
    },
  },
  { email },
);

// Managing Username
function onChangeUsername() {
  username.value = props.user.username;
  vUsername$.value.$reset();
  state.isEditingUsername = true;
}

async function onConfirmChangeUsername() {
  const isValid = await vUsername$.value.$validate();
  if (!isValid) {
    usernameInput.value?.focus();
    return;
  }

  if (username.value.toLowerCase() === props.user.username.toLowerCase()) {
    state.isEditingUsername = false;
    return;
  }

  state.isSavingUsername = true;
  await oops(
    async () => {
      await client.userAccounts.changeUsername(props.user, username.value);
      emit('change-username', username.value);
      toasts.toast({
        id: 'username-changed',
        message: 'Username was successfully changed.',
        type: ToastType.Success,
      });
      state.isEditingUsername = false;
    },
    {
      409: async () => {
        toasts.toast({
          id: 'username-conflict',
          message:
            'The username you entered is already in use. Please try another.',
          type: ToastType.Error,
        });

        state.isSavingUsername = false;
        await nextTick();
        usernameInput.value?.focus();
      },
    },
  );
  state.isSavingUsername = false;
}

function onCancelChangeUsername() {
  state.isEditingUsername = false;
}

// Managing Email address
function onChangeEmail() {
  email.value = props.user.email ?? '';
  vEmail$.value.$reset();
  state.isEditingEmail = true;
}

async function onConfirmChangeEmail(): Promise<void> {
  const isValid = await vEmail$.value.$validate();
  if (!isValid) {
    emailInput.value?.focus();
    return;
  }

  state.isSavingEmail = true;

  await oops(
    async () => {
      await client.userAccounts.changeEmail(props.user, email.value);
      emit('change-email', email.value);
      toasts.toast({
        id: 'email-changed',
        message: 'Email address was successfully changed.',
        type: ToastType.Success,
      });
      state.isEditingEmail = false;
    },
    {
      409: async () => {
        toasts.toast({
          id: 'email-conflict',
          message:
            'The email address you entered is already in use. Please try another.',
          type: ToastType.Error,
        });

        state.isSavingEmail = false;
        await nextTick();
        emailInput.value?.focus();
      },
    },
  );

  state.isSavingEmail = false;
}

function onCancelChangeEmail() {
  state.isEditingEmail = false;
}

async function onSendVerificationEmail(): Promise<void> {
  state.verificationEmail = VerificationEmailState.Sending;

  await oops(async () => {
    await client.userAccounts.requestEmailVerification(props.user.username);
    state.verificationEmail = VerificationEmailState.Sent;
  });

  if (state.verificationEmail === VerificationEmailState.Sending) {
    state.verificationEmail = VerificationEmailState.NotSent;
  }
}
</script>
