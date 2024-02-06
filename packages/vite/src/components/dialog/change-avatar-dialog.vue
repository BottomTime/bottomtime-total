<template>
  <DialogBase
    size="lg"
    title="Select Avatar"
    :visible="visible"
    @close="$emit('cancel')"
  >
    <template #default>
      <p
        class="w-full mx-auto mb-3 p-2 rounded-md text-sm text-center bg-link text-grey-900"
      >
        <span class="mr-3">
          <i class="fas fa-info-circle"></i>
        </span>
        <span class="font-bold">
          This is a temporary solution. I will add a proper avatar
          creator/editor later.
        </span>
      </p>

      <div class="flex flex-row gap-4">
        <UserAvatar :avatar="url" :display-name="displayName" size="x-large" />

        <div class="flex flex-col gap-4">
          <p>
            Select a source for your avatar. You can choose from one of the
            providers listed below:
          </p>

          <label for="avatar-none">
            <input
              id="avatar-none"
              v-model="url"
              class="mr-2"
              type="radio"
              name="avatar-source"
              value=""
            />
            <span class="font-bold">None </span>
            <span> - Display your initials</span>
          </label>

          <label for="avatar-gravatar">
            <input
              id="avatar-gravatar"
              v-model="url"
              class="mr-2"
              type="radio"
              name="avatar-source"
              :value="`https://gravatar.com/avatar/${displayName}`"
            />
            <span class="font-bold">Gravatar </span>
            <span>
              - Use
              <NavLink to="https://gravatar.com" new-tab>Gravatar</NavLink> to
              retrieve your profile pic</span
            >
          </label>
        </div>
      </div>
    </template>
    <template #buttons>
      <FormButton type="primary" @click="onSave"> Save </FormButton>
      <FormButton @click="$emit('cancel')"> Cancel </FormButton>
    </template>
  </DialogBase>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import FormButton from '../common/form-button.vue';
import NavLink from '../common/nav-link.vue';
import UserAvatar from '../users/user-avatar.vue';
import DialogBase from './dialog-base.vue';

type ChangeAvatarDialogProps = {
  avatarUrl: string;
  displayName: string;
  visible?: boolean;
};

const props = withDefaults(defineProps<ChangeAvatarDialogProps>(), {
  visible: false,
});

const url = ref(props.avatarUrl);

const emit = defineEmits<{
  (e: 'save', avatarUrl: string): void;
  (e: 'cancel'): void;
}>();

function onSave() {
  emit('save', '');
}
</script>
