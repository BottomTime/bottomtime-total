<template>
  <div>hi</div>
</template>

<script setup lang="ts">
import { OperatorDTO } from '@bottomtime/api';

interface EditTeamMembersProps {
  isSaving?: boolean;
  operator: OperatorDTO;
}

withDefaults(defineProps<EditTeamMembersProps>(), {
  isSaving: false,
});
</script>
