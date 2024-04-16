<template>
  <li>Sup?</li>
</template>

<script lang="ts" setup>
import { FriendDTO } from '@bottomtime/api';

interface FriendsListItemProps {
  friend: FriendDTO;
}

defineProps<FriendsListItemProps>();
</script>
