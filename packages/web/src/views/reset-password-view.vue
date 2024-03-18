<template>
  <PageTitle title="Reset Password" />
  <div class="grid grid-cols-1 md:grid-cols-5">
    <TransitionGroup name="fade" tag="div" class="md:col-start-2 md:col-span-3">
      <FormBox
        v-if="emailSent"
        class="md:col-start-2 md:col-span-3 flex flex-row gap-6"
      >
        <span class="text-success">
          <i class="fas fa-envelope fa-5x"></i>
        </span>
        <div>
          <p class="font-bold text-lg text-success mb-6">
            An email has been sent to the address associated with your account.
          </p>
          <p class="mb-6">
            <strong>NOTE: </strong>It may take several minutes to arrive in your
            inbox. If you don't receive an email, please check your spam folder
            and, if you still cannot find the message, try refreshing this page
            and requesting a new email.
          </p>
          <p>
            If you continue to have trouble, please contact
            <NavLink :to="adminEmail">support</NavLink> for help.
          </p>
        </div>
      </FormBox>

      <FormBox v-else class="md:col-start-2 md:col-span-3">
        <p class="mb-6">
          Enter your username or email address to reset your password. You will
          be sent an email to the address associated with your account. It will
          contain your username and a link to reset your password, if necessary.
        </p>

        <fieldset :disabled="isLoading">
          <div class="flex flex-row gap-4 items-baseline">
            <FormLabel
              class="w-48 text-right"
              for="username"
              label="Username or email"
            />

            <div class="grow flex flex-col gap-2">
              <FormTextBox
                ref="usernameOrEmailInput"
                v-model.trim="data.usernameOrEmail"
                control-id="username"
                :maxlength="50"
                :invalid="v$.usernameOrEmail.$error"
                autofocus
              />
              <span v-if="v$.usernameOrEmail.$error" class="text-danger">
                {{ v$.usernameOrEmail.$errors[0]?.$message }}
              </span>
            </div>

            <FormButton
              class="w-40"
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
      </FormBox>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';

import { computed, reactive, ref } from 'vue';

import FormBox from '../components/common/form-box.vue';
import FormButton from '../components/common/form-button.vue';
import FormLabel from '../components/common/form-label.vue';
import FormTextBox from '../components/common/form-text-box.vue';
import NavLink from '../components/common/nav-link.vue';
import PageTitle from '../components/common/page-title.vue';
import { Config } from '../config';

const data = reactive<{ usernameOrEmail: string }>({
  usernameOrEmail: '',
});
const usernameOrEmailInput = ref<InstanceType<typeof FormTextBox> | null>(null);
const isLoading = ref(false);
const emailSent = ref(false);
const adminEmail = computed(() => `mailto:${Config.adminEmail}`);

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

async function onSubmit(): Promise<void> {
  const isValid = await v$.value.$validate();
  if (!isValid) {
    usernameOrEmailInput.value?.focus();
    return;
  }

  isLoading.value = true;

  await new Promise((resolve) => setTimeout(resolve, 1000));

  data.usernameOrEmail = '';
  v$.value.$reset();

  emailSent.value = true;
  isLoading.value = false;
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
