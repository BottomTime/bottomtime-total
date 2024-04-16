<template>
  <li>Yo!</li>
</template>

<script lang="ts" setup>
import { FriendRequestDTO } from '@bottomtime/api';

interface FriendRequestsListItemProps {
  request: FriendRequestDTO;
}

defineProps<FriendRequestsListItemProps>();
</script>
