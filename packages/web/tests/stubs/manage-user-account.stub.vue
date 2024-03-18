<template>
  <div data-testid="manage-user-account"></div>
</template>

<script lang="ts" setup>
import { UserDTO, UserRole } from '@bottomtime/api';

type ManageUserAccountProps = {
  user: UserDTO;
};

const props = defineProps<ManageUserAccountProps>();

const emit = defineEmits<{
  (e: 'account-lock-toggled', userId: string): void;
  (e: 'password-reset', userId: string): void;
  (e: 'role-changed', userId: string, newRole: UserRole): void;
  (e: 'username-changed', userId: string, username: string): void;
  (e: 'email-changed', userId: string, email: string): void;
}>();

function toggleAccountLock() {
  emit('account-lock-toggled', props.user.id);
}

function resetPassword() {
  emit('password-reset', props.user.id);
}

function changeRole(newRole: UserRole) {
  emit('role-changed', props.user.id, newRole);
}

function changeUsername(username: string) {
  emit('username-changed', props.user.id, username);
}

function changeEmail(email: string) {
  emit('email-changed', props.user.id, email);
}

defineExpose({
  toggleAccountLock,
  resetPassword,
  changeRole,
  changeUsername,
  changeEmail,
});
</script>
