<template>
  <div data-testid="edit-profile"></div>
</template>

<script lang="ts" setup>
import { ProfileDTO } from '@bottomtime/api';

type EditProfileProps = {
  profile: ProfileDTO;
};

const props = defineProps<EditProfileProps>();

const emit = defineEmits<{
  (e: 'save-profile', profile: ProfileDTO): void;
}>();

function saveProfile() {
  emit('save-profile', props.profile);
}

defineExpose({ saveProfile });
</script>
