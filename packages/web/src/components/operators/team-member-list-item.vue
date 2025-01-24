<template>
  <li>Yo</li>
</template>

<script lang="ts" setup>
import { TeamMemberDTO } from '@bottomtime/api';

interface TeamMemberListItemProps {
  teamMember: TeamMemberDTO;
}

defineProps<TeamMemberListItemProps>();
</script>
