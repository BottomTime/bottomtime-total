<template>
  <div data-testid="edit-settings"></div>
</template>

<script lang="ts" setup>
import { UserDTO, UserSettingsDTO } from '@bottomtime/api';

type EditSettingsProps = {
  user: UserDTO;
};

const props = defineProps<EditSettingsProps>();
const emit = defineEmits<{
  (e: 'save-settings', settings: UserSettingsDTO): void;
}>();

function saveSettings() {
  emit('save-settings', props.user.settings);
}

defineExpose({ saveSettings });
</script>
