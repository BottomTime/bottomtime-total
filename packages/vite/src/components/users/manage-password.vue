<template>
  <ChangePasswordDialog
    ref="changePasswordDialog"
    :visible="state.showChangePassword"
    :is-working="state.isSavingPassword"
    :require-old-password="!admin"
    @cancel="onCancelChangePassword"
    @confirm="onConfirmChangePassword"
  />
  <FormField label="Password">
    <div class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-baseline">
      <div
        data-testid="password-status"
        :class="`grow flex gap-3 text-sm ${
          user.hasPassword ? 'text-success' : 'text-warn'
        }`"
      >
        <span v-if="user.hasPassword">
          <i class="fas fa-check"></i>
        </span>
        <span v-else>
          <i class="fas fa-exclamation-triangle"></i>
        </span>
        <span>
          {{
            user.hasPassword
              ? 'A password has been set on this account'
              : 'A password has not yet been set on this account'
          }}
        </span>
      </div>
      <div class="min-w-36 lg:min-w-40 xl:min-w-48">
        <FormButton stretch test-id="change-password" @click="onChangePassword">
          {{ admin ? 'Reset' : 'Change' }}
          password...
        </FormButton>
      </div>
    </div>
  </FormField>
</template>

<script lang="ts" setup>
import { UserDTO } from '@bottomtime/api';

import { reactive, ref } from 'vue';

import { useClient } from '../../client';
import { ToastType } from '../../common';
import { useOops } from '../../oops';
import { useToasts } from '../../store';
import FormButton from '../common/form-button.vue';
import FormField from '../common/form-field.vue';
import ChangePasswordDialog from '../dialog/change-password-dialog.vue';

type ManagePasswordProps = {
  user: UserDTO;
  admin?: boolean;
};
type ManagePasswordState = {
  showChangePassword: boolean;
  isSavingPassword: boolean;
};

const client = useClient();
const oops = useOops();
const toasts = useToasts();

const props = withDefaults(defineProps<ManagePasswordProps>(), {
  admin: false,
});
const state = reactive<ManagePasswordState>({
  showChangePassword: false,
  isSavingPassword: false,
});
const emit = defineEmits<{
  (e: 'change-password'): void;
}>();
const changePasswordDialog = ref<InstanceType<
  typeof ChangePasswordDialog
> | null>(null);

function onChangePassword() {
  state.showChangePassword = true;
}

async function onConfirmChangePassword(
  newPassword: string,
  oldPassword?: string,
): Promise<void> {
  state.isSavingPassword = true;

  await oops(async () => {
    const user = client.users.wrapDTO(props.user);

    if (props.admin) {
      await user.resetPassword(newPassword);
    } else {
      const success = await user.changePassword(oldPassword ?? '', newPassword);

      if (!success) {
        toasts.toast({
          id: 'password-incorrect',
          message: 'Your old password was incorrect. Please try again.',
          type: ToastType.Error,
        });
        changePasswordDialog.value?.clearOldPassword();
        return;
      }
    }

    emit('change-password');
    toasts.toast({
      id: 'password-changed',
      message: 'Password was successfully changed.',
      type: ToastType.Success,
    });
    state.showChangePassword = false;
    changePasswordDialog.value?.reset();
  });

  state.isSavingPassword = false;
}

function onCancelChangePassword() {
  state.showChangePassword = false;
  changePasswordDialog.value?.reset();
}
</script>
