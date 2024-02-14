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
        <strong>{{ user.profile?.name || user.username }}</strong
        >?
      </p>
    </div>
  </ConfirmDialog>

  <div class="flex flex-col gap-4">
    <div class="flex flex-row mb-4">
      <TextHeading class="grow">Account Activity</TextHeading>
      <div class="text-sm text-right">
        <FormToggle
          v-model="state.showExactTimes"
          label="Show exact times"
          test-id="toggle-fuzzy-timestamps"
        />
      </div>
    </div>
    <AccountTimestamps :user="user" :exact-times="state.showExactTimes" />

    <TextHeading>Username And Email</TextHeading>
    <UsernameAndEmail
      :user="user"
      @change-email="(email) => $emit('email-changed', user.id, email)"
      @change-username="
        (username) => $emit('username-changed', user.id, username)
      "
    />

    <TextHeading>Update Account</TextHeading>
    <ManagePassword
      :user="user"
      :admin="true"
      @change-password="$emit('password-reset', user.id)"
    />

    <FormField label="Account status">
      <div class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline">
        <span
          :class="`grow text-sm ${
            user.isLockedOut ? 'text-danger' : 'text-success'
          }`"
        >
          {{ user.isLockedOut ? 'Suspended' : 'Active' }}
        </span>
        <FormButton
          class="min-w-36 lg:min-w-40 xl:min-w-48"
          :is-loading="state.isTogglingLockout"
          @click="onToggleLockout"
        >
          {{
            user.isLockedOut ? 'Reactivate Account...' : 'Suspend Account...'
          }}
        </FormButton>
      </div>
    </FormField>

    <FormField label="User role">
      <div class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline">
        <div class="grow">
          <FormSelect
            v-if="state.isChangingRole"
            v-model="state.selectedRole"
            control-id="user-role"
            test-id="user-role"
            :options="RoleOptions"
            autofocus
          />
          <span v-else class="text-sm">
            {{ user.role }}
          </span>
        </div>
        <div class="min-w-40">
          <div v-if="state.isChangingRole" class="grid grid-cols-2 gap-2">
            <FormButton type="primary" submit @click="onSaveRoleChange">
              <span class="text-success mr-1">
                <i class="fas fa-check"></i>
              </span>
              <span>Save</span>
            </FormButton>
            <FormButton @click="onCancelRoleChange">
              <span class="text-danger mr-1">
                <i class="fas fa-times"></i>
              </span>
              <span>Cancel</span>
            </FormButton>
          </div>

          <FormButton
            v-else
            class="min-w-36 lg:min-w-40 xl:min-w-48"
            @click="onChangeRole"
          >
            Change Role...
          </FormButton>
        </div>
      </div>
    </FormField>
  </div>
</template>

<script setup lang="ts">
import { UserDTO, UserRole } from '@bottomtime/api';

import { reactive } from 'vue';

import { useClient } from '../../client';
import { SelectOption, ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import FormSelect from '../common/form-select.vue';
import FormToggle from '../common/form-toggle.vue';
import TextHeading from '../common/text-heading.vue';
import ConfirmDialog from '../dialog/confirm-dialog.vue';
import AccountTimestamps from '../users/account-timestamps.vue';
import ManagePassword from '../users/manage-password.vue';
import UsernameAndEmail from '../users/username-and-email.vue';

// Type Defs
type ManageUserAccountProps = {
  user: UserDTO;
};
type ManageUserAccountState = {
  isChangingRole: boolean;
  isTogglingLockout: boolean;
  selectedRole: UserRole;
  showConfirmToggleLockout: boolean;
  showExactTimes: boolean;
};

const RoleOptions: SelectOption[] = [
  { label: 'User', value: UserRole.User },
  { label: 'Administrator', value: UserRole.Admin },
];

// Dependencies
const client = useClient();
const toasts = useToasts();
const oops = useOops();

// Component state
const props = defineProps<ManageUserAccountProps>();
const state = reactive<ManageUserAccountState>({
  isChangingRole: false,
  isTogglingLockout: false,
  selectedRole: props.user.role,
  showExactTimes: false,
  showConfirmToggleLockout: false,
});

// Emits
const emit = defineEmits<{
  (e: 'account-lock-toggled', userId: string): void;
  (e: 'password-reset', userId: string): void;
  (e: 'role-changed', userId: string, newRole: UserRole): void;
  (e: 'username-changed', userId: string, username: string): void;
  (e: 'email-changed', userId: string, email: string): void;
}>();

function onToggleLockout() {
  state.showConfirmToggleLockout = true;
}

async function onConfirmToggleLockout(): Promise<void> {
  state.isTogglingLockout = true;
  state.showConfirmToggleLockout = false;

  await oops(async () => {
    const user = client.users.wrapDTO(props.user);
    await user.toggleAccountLock();
    emit('account-lock-toggled', user.id);
    toasts.toast({
      id: 'account-lock-toggled',
      type: ToastType.Success,
      message: `Account has successfully been ${
        user.isLockedOut ? 'suspended' : 'reactivated'
      }.`,
    });
  });

  state.isTogglingLockout = false;
}

function onCancelToggleLockout() {
  state.showConfirmToggleLockout = false;
}

function onChangeRole() {
  state.isChangingRole = true;
}

async function onSaveRoleChange(): Promise<void> {
  state.isChangingRole = false;
  await oops(async () => {
    const user = client.users.wrapDTO(props.user);
    await user.changeRole(state.selectedRole);
    emit('role-changed', user.id, state.selectedRole);
    toasts.toast({
      id: 'role-changed',
      type: ToastType.Success,
      message: `Role has successfully been changed to "${state.selectedRole}"".`,
    });
  });
}

function onCancelRoleChange() {
  state.isChangingRole = false;
  state.selectedRole = props.user.role;
}
</script>
