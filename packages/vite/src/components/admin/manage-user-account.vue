<template>
  <!-- Confirm account lock/unlock -->
  <ConfirmDialog
    :confirm-text="user.isLockedOut ? 'Reactivate' : 'Suspend'"
    :title="user.isLockedOut ? 'Reactivate Account?' : 'Suspend Account?'"
    :visible="state.showConfirmToggleLockout"
    @confirm="onConfirmToggleLockout"
    @cancel="onCancelToggleLockout"
  >
    <div class="flex gap-3">
      <span>
        <i class="fas fa-question-circle fa-2x"></i>
      </span>
      <p>
        Are you sure you want to
        {{ user.isLockedOut ? 'reactivate' : 'suspend' }} the account for
        <strong>{{ user.displayName }}</strong
        >?
      </p>
    </div>
  </ConfirmDialog>

  <ChangePasswordDialog
    :visible="state.showChangePassword"
    :is-working="state.isChangingPassword"
    :require-old-password="false"
    @confirm="onConfirmResetPassword"
    @cancel="onCancelResetPassword"
  />

  <div class="flex flex-row mb-4">
    <h1 class="grow text-xl font-bold font-title">Account Activity</h1>
    <div class="text-sm text-right">
      <FormToggle v-model="state.showExactTimes" label="Show exact times" />
    </div>
  </div>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-3 text-center mb-6">
      <div class="flex flex-col">
        <label class="font-bold">Joined</label>
        <span class="italic">
          {{ formatTime(user.memberSince) }}
        </span>
      </div>

      <div class="flex flex-col">
        <label class="font-bold">Last Login</label>
        <span class="italic">
          {{ formatTime(user.lastLogin) }}
        </span>
      </div>

      <div class="flex flex-col">
        <label class="font-bold">Last Password Change</label>
        <span class="italic">
          {{ formatTime(user.lastPasswordChange) }}
        </span>
      </div>
    </div>

    <h1 class="text-xl font-bold font-title mb-4">Update Account</h1>
    <div class="flex flex-row gap-3 items-baseline">
      <label class="font-bold text-right w-36">Account Status:</label>
      <span
        :class="`grow ${user.isLockedOut ? 'text-danger' : 'text-success'}`"
      >
        {{ user.isLockedOut ? 'Suspended' : 'Active' }}
      </span>
      <FormButton
        class="w-40"
        :is-loading="state.isTogglingLockout"
        @click="onToggleLockout"
      >
        {{ user.isLockedOut ? 'Reactivate Account...' : 'Suspend Account...' }}
      </FormButton>
    </div>

    <div class="flex flex-row gap-3 items-baseline">
      <label class="font-bold text-right w-36">Account Password:</label>
      <span class="grow">
        {{
          user.hasPassword
            ? 'User has set a password on their account'
            : 'User has not set a password on their account'
        }}
      </span>
      <FormButton class="w-40" @click="onResetPassword">
        Reset Password...
      </FormButton>
    </div>

    <div class="flex flex-row gap-3 items-baseline">
      <label class="font-bold text-right w-36">User Role:</label>
      <span class="grow">
        {{ user.role }}
      </span>
      <FormButton class="w-40" @click="onChangeRole">
        Change Role...
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import 'dayjs/plugin/relativeTime';
import { reactive } from 'vue';

import { User } from '../../client';
import { useOops } from '../../oops';
import FormButton from '../common/form-button.vue';
import FormToggle from '../common/form-toggle.vue';
import ChangePasswordDialog from '../dialog/change-password-dialog.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';

type ManageUserAccountProps = {
  user: User;
};
type ManageUserAccountState = {
  isChangingPassword: boolean;
  isTogglingLockout: boolean;
  showConfirmToggleLockout: boolean;
  showChangePassword: boolean;
  showExactTimes: boolean;
};

const oops = useOops();

const props = defineProps<ManageUserAccountProps>();
const state = reactive<ManageUserAccountState>({
  isChangingPassword: false,
  isTogglingLockout: false,
  showExactTimes: false,
  showChangePassword: false,
  showConfirmToggleLockout: false,
});

function formatTime(time?: Date) {
  if (!time) return 'Never';
  return state.showExactTimes
    ? dayjs(time).format('MMMM D, YYYY h:mm:ss A')
    : dayjs(time).fromNow();
}

function onResetPassword() {
  state.showChangePassword = true;
}

async function onConfirmResetPassword(newPassword: string): Promise<void> {
  state.isChangingPassword = true;
}

function onCancelResetPassword() {
  state.showChangePassword = false;
}

function onToggleLockout() {
  state.showConfirmToggleLockout = true;
}

async function onConfirmToggleLockout(): Promise<void> {
  state.isTogglingLockout = true;
  state.showConfirmToggleLockout = false;

  await oops(async () => {
    await props.user.toggleAccountLock();
  });

  state.isTogglingLockout = false;
}

function onCancelToggleLockout() {
  state.showConfirmToggleLockout = false;
}

function onChangeRole() {}
</script>
