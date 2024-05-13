<template>
  <TransitionGroup
    name="fade"
    tag="div"
    class="grid grid-cols-1 lg:grid-cols-5"
  >
    <FormBox
      v-if="emailSent"
      class="lg:col-start-2 lg:col-span-3 flex flex-row gap-6"
    >
      <span class="text-success">
        <i class="fas fa-envelope fa-5x"></i>
      </span>
      <div class="space-y-3">
        <p class="font-bold text-lg text-success mb-6">
          An email has been sent to the address associated with your account.
        </p>
        <p>
          <span class="font-bold">NOTE: </span>
          <span>
            It may take several minutes to arrive in your inbox. If you don't
            receive an email, please check your spam folder and, if you still
            cannot find the message, try refreshing this page and requesting a
            new email.
          </span>
        </p>
        <p>
          If you continue to have trouble, please contact
          <NavLink :to="adminEmail">support</NavLink> for help.
        </p>
      </div>
    </FormBox>

    <FormBox v-else class="lg:col-start-2 lg:col-span-3">
      <p class="mb-6">
        Enter your username or email address to reset your password. You will be
        sent an email to the address associated with your account. It will
        contain your username and a link to reset your password, if necessary.
      </p>

      <form @submit.prevent="onSubmit">
        <fieldset class="space-y-4" :disabled="isLoading">
          <FormField
            label="Username or email"
            control-id="username"
            :invalid="v$.usernameOrEmail.$error"
            :error="v$.usernameOrEmail.$errors[0]?.$message"
            required
          >
            <FormTextBox
              ref="usernameOrEmailInput"
              v-model.trim="data.usernameOrEmail"
              control-id="username"
              :maxlength="50"
              :invalid="v$.usernameOrEmail.$error"
              autofocus
            />
          </FormField>

          <div class="text-center">
            <FormButton
              type="primary"
              submit
              test-id="reset-password-submit"
              :is-loading="isLoading"
              @click="onSubmit"
            >
              Send Recovery Email
            </FormButton>
          </div>
        </fieldset>
      </form>
    </FormBox>
  </TransitionGroup>
</template>

<script lang="ts" setup>
import useVuelidate from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import { computed, reactive } from 'vue';

import { Config } from '../../config';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormTextBox from '../common/form-text-box.vue';
import NavLink from '../common/nav-link.vue';

interface RequestPasswordResetProps {
  emailSent: boolean;
  isLoading: boolean;
}

defineProps<RequestPasswordResetProps>();
const emit = defineEmits<{
  (e: 'request-email', usernameOrEmail: string): void;
}>();

const data = reactive<{ usernameOrEmail: string }>({
  usernameOrEmail: '',
});

const v$ = useVuelidate(
  {
    usernameOrEmail: {
      required: helpers.withMessage(
        'Username or email is required to proceed',
        required,
      ),
    },
  },
  data,
);

const adminEmail = computed(() => `mailto:${Config.adminEmail}`);

async function onSubmit(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (isValid) emit('request-email', data.usernameOrEmail);
}
</script>

<style scoped>
.fade-enter-active {
  transition: all 0.75s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
