<template>
  <div v-if="isLoading">
    <p
      class="text-lg italic flex space-x-3 justify-center items-baseline w-full"
    >
      <span>
        <i class="fa-solid fa-spinner fa-spin"></i>
      </span>
      <span>Loading...</span>
    </p>
  </div>

  <div v-else-if="props.users.totalCount === 0">
    <p
      class="text-lg italic flex space-x-3 justify-center items-baseline w-full"
    >
      <span>
        <i class="fa-solid fa-circle-info"></i>
      </span>
      <span>No users found.</span>
    </p>
  </div>

  <div v-else class="flex flex-col space-y-3">
    <FormBox class="w-full">
      <p>
        <span>Showing </span>
        <span class="font-bold">{{ props.users.users.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ props.users.totalCount }}</span>
        <span> results</span>
      </p>
    </FormBox>

    <ul>
      <SearchFriendsListItem
        v-for="user in props.users.users"
        :key="user.userId"
        :user="user"
        @send-request="$emit('send-request', user)"
      />
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { SearchProfilesResponseDTO, SuccinctProfileDTO } from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import SearchFriendsListItem from './search-friends-list-item.vue';

interface SearchFriendsListProps {
  isLoading?: boolean;
  users: SearchProfilesResponseDTO;
}

const props = withDefaults(defineProps<SearchFriendsListProps>(), {
  isLoading: false,
});
defineEmits<{
  (e: 'send-request', user: SuccinctProfileDTO): void;
}>();
</script>
