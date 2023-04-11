<template>
  <form id="form-acccount-general" @submit.prevent="() => {}">
    <h1 class="title">General</h1>

    <HorizontalFormField label="Username" required>
      <div v-if="data.editUsername" class="field has-addons">
        <div class="control is-expanded has-icons-right">
          <TextBox
            id="username"
            v-model="data.username"
            :disabled="data.savingUsername"
            :size="TextBoxSize.Normal"
            autofocus
            @enter="onSaveUsername"
            @escape="onCancelEditUsername"
          />
          <span v-if="data.savingUsername" class="icon is-right">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
        </div>
        <div v-if="!data.savingUsername" class="control">
          <button
            class="button is-primary"
            aria-label="Save changes to username"
            @click="onSaveUsername"
          >
            <span class="icon">
              <i class="fas fa-check"></i>
            </span>
          </button>
        </div>
        <div v-if="!data.savingUsername" class="control">
          <button
            class="button"
            aria-label="Cancel changes to username"
            @click="onCancelEditUsername"
          >
            <span class="icon">
              <i class="fas fa-times"></i>
            </span>
          </button>
        </div>
      </div>

      <div v-else class="field has-addons">
        <div class="control is-expanded">
          <input class="input" type="text" :value="data.username" disabled />
        </div>
        <div class="control">
          <button
            class="button"
            aria-label="Change username"
            @click="onEditUsername"
          >
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-edit"></i>
              </span>
            </span>
          </button>
        </div>
      </div>
    </HorizontalFormField>

    <HorizontalFormField label="Email" required>
      <div v-if="data.editEmail" class="field has-addons">
        <div class="control is-expanded has-icons-right">
          <TextBox
            id="email"
            v-model="data.email"
            :disabled="data.savingEmail"
            :size="TextBoxSize.Normal"
            autofocus
            @enter="onSaveEmail"
            @escape="onCancelEditEmail"
          />
          <span v-if="data.savingEmail" class="icon is-right">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
        </div>
        <div v-if="!data.savingEmail" class="control">
          <button
            class="button is-primary"
            aria-label="Save changes to email address"
            @click="onSaveEmail"
          >
            <span class="icon">
              <i class="fas fa-check"></i>
            </span>
          </button>
        </div>
        <div v-if="!data.savingEmail" class="control">
          <button
            class="button"
            aria-label="Cancel changes to email address"
            @click="onCancelEditEmail"
          >
            <span class="icon">
              <i class="fas fa-times"></i>
            </span>
          </button>
        </div>
      </div>

      <div v-else class="field has-addons">
        <div class="control is-expanded">
          <input class="input" type="email" :value="data.email" disabled />
        </div>
        <div class="control">
          <button
            class="button"
            aria-label="Edit email address"
            @click="onEditEmail"
          >
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-edit"></i>
              </span>
            </span>
          </button>
        </div>
      </div>
    </HorizontalFormField>

    <!-- Email verification status... -->
    <HorizontalFormField>
      <EmailVerificationStatus :user="currentUser!" />
    </HorizontalFormField>
  </form>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import { Dispatch, useStore } from '@/store';
import EmailVerificationStatus from '@/components/account/EmailVerificationStatus.vue';
import HorizontalFormField from '@/components/forms/HorizontalFormField.vue';
import TextBox from '@/components/forms/TextBox.vue';
import { TextBoxSize } from '@/constants';
import { Toast, ToastType, inject } from '@/helpers';
import { WithErrorHandlingKey } from '@/injection-keys';

interface AccountMainData {
  username: string;
  email: string;
  editEmail: boolean;
  editUsername: boolean;
  savingEmail: boolean;
  savingUsername: boolean;
}

const EmailSavedToast: Toast = {
  id: 'email-saved',
  type: ToastType.Success,
  message: 'Your email address has been updated.',
};

const UsernameSavedToast: Toast = {
  id: 'username-saved',
  type: ToastType.Success,
  message: 'Your username has been updated.',
};

const store = useStore();
const withErrorHandling = inject(WithErrorHandlingKey);

const currentUser = computed(() => store.state.currentUser);
const data = reactive<AccountMainData>({
  username: currentUser.value?.username ?? '',
  email: currentUser.value?.email ?? '',
  editEmail: false,
  editUsername: false,
  savingEmail: false,
  savingUsername: false,
});

async function onEditUsername() {
  data.editUsername = true;
}

async function onSaveUsername() {
  data.savingUsername = true;
  await withErrorHandling(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await store.dispatch(Dispatch.Toast, UsernameSavedToast);
    data.editUsername = false;
  });
  data.savingUsername = false;
}

function onCancelEditUsername() {
  data.username = currentUser.value!.username;
  data.editUsername = false;
}

async function onEditEmail() {
  data.editEmail = true;
}

async function onSaveEmail() {
  data.savingEmail = true;
  await withErrorHandling(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await store.dispatch(Dispatch.Toast, EmailSavedToast);
    data.editEmail = false;
  });
  data.savingEmail = false;
}

function onCancelEditEmail() {
  data.email = currentUser.value?.email ?? '';
  data.editEmail = false;
}
</script>
