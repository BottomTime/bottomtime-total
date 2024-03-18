<template>
  <div data-testid="edit-profile"></div>
</template>

<script lang="ts" setup>
import { ProfileDTO, UserDTO } from '@bottomtime/api';

type EditProfileProps = {
  user: UserDTO;
};

const props = defineProps<EditProfileProps>();

const emit = defineEmits<{
  (e: 'save-profile', profile: ProfileDTO): void;
}>();

function saveProfile() {
  emit('save-profile', props.user.profile);
}

defineExpose({ saveProfile });
</script>
