<template>
  <div v-if="isLoading">
    <p
      class="text-lg italic flex space-x-3 justify-center items-baseline w-full"
      data-testid="search-friends-loading"
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
      data-testid="search-friends-no-results"
    >
      <span>
        <i class="fa-solid fa-circle-info"></i>
      </span>
      <span>No users found.</span>
    </p>
  </div>

  <div v-else class="flex flex-col space-y-3">
    <FormBox class="w-full">
      <p data-testid="search-friends-counts">
        <span>Showing </span>
        <span class="font-bold">{{ props.users.data.length }}</span>
        <span> of </span>
        <span class="font-bold">{{ props.users.totalCount }}</span>
        <span> users</span>
      </p>
    </FormBox>

    <ul data-testid="search-friends-list">
      <SearchFriendsListItem
        v-for="user in props.users.data"
        :key="user.userId"
        :user="user"
        @send-request="$emit('send-request', user)"
      />

      <li
        v-if="users.data.length < users.totalCount"
        class="min-h-20 flex items-center justify-center text-lg"
      >
        <p
          v-if="isLoadingMore"
          class="space-x-3 italic"
          data-testid="search-friends-loading-more"
        >
          <span>
            <i class="fa-solid fa-spinner fa-spin"></i>
          </span>
          <span>Loading more users...</span>
        </p>

        <p v-else>
          <FormButton
            type="link"
            size="lg"
            test-id="search-friends-load-more"
            @click="$emit('load-more')"
          >
            Load more users...
          </FormButton>
        </p>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ApiList, SuccinctProfileDTO } from '@bottomtime/api';

import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import SearchFriendsListItem from './search-friends-list-item.vue';

interface SearchFriendsListProps {
  isLoading?: boolean;
  isLoadingMore?: boolean;
  users: ApiList<SuccinctProfileDTO>;
}

const props = withDefaults(defineProps<SearchFriendsListProps>(), {
  isLoading: false,
  isLoadingMore: false,
});
defineEmits<{
  (e: 'send-request', user: SuccinctProfileDTO): void;
  (e: 'load-more'): void;
}>();
</script>
