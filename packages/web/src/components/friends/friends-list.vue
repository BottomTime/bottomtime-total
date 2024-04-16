<template>
  <div>Friends list {{ friends.totalCount }}</div>
  <ul>
    <FriendsListItem
      v-for="friend in friends.friends"
      :key="friend.id"
      :friend="friend"
    />
  </ul>
</template>

<script lang="ts" setup>
import { ListFriendsResponseDTO } from '@bottomtime/api';

import FriendsListItem from './friends-list-item.vue';

interface FriendsListProps {
  friends: ListFriendsResponseDTO;
}

defineProps<FriendsListProps>();
</script>
