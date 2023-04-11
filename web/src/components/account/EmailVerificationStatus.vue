<template>
  <div class="control">
    <!-- Verification email is being requested... -->
    <span v-if="emailSending" class="icon-text">
      <span class="icon has-text-link">
        <i class="fas fa-spinner fa-spin"></i>
      </span>
      <span class="is-italic">Sending verification email...</span>
    </span>

    <!-- Verification email is being sent. User needs to check their inbox... -->
    <span v-else-if="emailSent" class="icon-text">
      <span class="icon has-text-info">
        <i class="far fa-comment"></i>
      </span>
      <span>Check your email for a link to verify your email address</span>
      <span class="help">
        It may take a few minutes for the email to arrive in your inbox. If you
        do not receive it in the next few minutes, then check your spam folder.
        If you still don't see it you can
        <a @click="requestVerificationEmail">click here</a>
        to resend it.
      </span>
    </span>

    <!-- User email is verifiied! Yay! -->
    <span v-else-if="emailVerified" class="icon-text">
      <span class="icon has-text-success">
        <i class="fas fa-check"></i>
      </span>
      <span>Your email address is verified</span>
    </span>

    <!-- User email is unverified. -->
    <span v-else class="icon-text">
      <span class="icon has-text-warning">
        <i class="fas fa-exclamation"></i>
      </span>
      <span>Your email address is unverified</span>
      <span class="help">
        <a @click="requestVerificationEmail"
          >Click to send verification email</a
        >
      </span>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, ref } from 'vue';

import { inject } from '@/helpers';
import { User } from '@/users';
import { WithErrorHandlingKey } from '@/injection-keys';

interface EmailVerificationStatusProps {
  user: User;
}

const withErrorHandling = inject(WithErrorHandlingKey);

const props = defineProps<EmailVerificationStatusProps>();

const emailVerified = computed(() => props.user.emailVerified);
const emailSending = ref(false);
const emailSent = ref(false);

async function requestVerificationEmail() {
  emailSending.value = true;

  await withErrorHandling(async () => {
    await props.user.requestVerificationEmail();
    emailSent.value = true;
  });

  emailSending.value = false;
}
</script>
