<template>
  <FormBox class="flex flex-col lg:flex-row justify-between items-center">
    <p data-testid="friends-count">
      <span>Showing </span>
      <span class="font-bold">{{ friends.friends.length }}</span>
      <span> of </span>
      <span class="font-bold">{{ friends.totalCount }}</span>
      <span> friends</span>
    </p>

    <div class="flex space-x-3 items-baseline">
      <label class="font-bold" for="sort-order">Sort order:</label>
      <FormSelect
        v-model="sortOrderString"
        control-id="sort-order"
        test-id="sort-order"
        :options="SortOrderOptions"
      />
      <FormButton type="primary" @click="$emit('add-friend')">
        Add Friend
      </FormButton>
    </div>
  </FormBox>

  <ul v-if="friends.friends.length" data-testid="friends-list">
    <FriendsListItem
      v-for="friend in friends.friends"
      :key="friend.id"
      :friend="friend"
      @select="(friend) => $emit('select', friend)"
      @unfriend="(friend) => $emit('unfriend', friend)"
    />

    <li
      v-if="friends.friends.length < friends.totalCount"
      class="min-h-24 flex items-center justify-center"
    >
      <p
        v-if="isLoadingMore"
        class="flex space-x-3 text-lg italic"
        data-testid="friends-loading-more"
      >
        <span>
          <i class="fa-solid fa-spinner fa-spin"></i>
        </span>
        <span>Loading more friends...</span>
      </p>

      <FormButton
        v-else
        type="link"
        size="lg"
        test-id="friends-load-more"
        @click="$emit('load-more')"
      >
        Load more friends...
      </FormButton>
    </li>
  </ul>

  <p
    v-else
    data-testid="no-friends"
    class="py-6 text-lg italic flex space-x-3 justify-center"
  >
    <span>
      <i class="fa-solid fa-circle-info"></i>
    </span>
    <span> You have not added any friends yet. You can click the </span>
    <FormButton type="link" size="md" @click="$emit('add-friend')">
      here
    </FormButton>
    <span> to search for your first dive buddy!</span>
  </p>
</template>

<script lang="ts" setup>
import {
  FriendDTO,
  FriendsSortBy,
  ListFriendsResponseDTO,
  SortOrder,
} from '@bottomtime/api';

import { ref, watch } from 'vue';

import { SelectOption } from '../../common';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormSelect from '../common/form-select.vue';
import FriendsListItem from './friends-list-item.vue';

interface FriendsListProps {
  friends: ListFriendsResponseDTO;
  isLoadingMore?: boolean;
  sortBy?: FriendsSortBy;
  sortOrder?: SortOrder;
}

const SortOrderOptions: SelectOption[] = [
  {
    label: 'Username (A-Z)',
    value: `${FriendsSortBy.Username}-${SortOrder.Ascending}`,
  },
  {
    label: 'Username (Z-A)',
    value: `${FriendsSortBy.Username}-${SortOrder.Descending}`,
  },
  {
    label: 'Friendship (newest to oldest)',
    value: `${FriendsSortBy.FriendsSince}-${SortOrder.Descending}`,
  },
  {
    label: 'Friendship (oldest to newest)',
    value: `${FriendsSortBy.FriendsSince}-${SortOrder.Ascending}`,
  },
];

const props = withDefaults(defineProps<FriendsListProps>(), {
  sortBy: FriendsSortBy.Username,
  sortOrder: SortOrder.Ascending,
});
const emit = defineEmits<{
  (e: 'add-friend'): void;
  (e: 'change-sort-order', sortBy: FriendsSortBy, sortOrder: SortOrder): void;
  (e: 'load-more'): void;
  (e: 'select', friend: FriendDTO): void;
  (e: 'unfriend', friend: FriendDTO): void;
}>();

const sortOrderString = ref(`${props.sortBy}-${props.sortOrder}`);

watch(sortOrderString, (val) => {
  const [sortBy, sortOrder] = val.split('-') as [FriendsSortBy, SortOrder];
  emit('change-sort-order', sortBy, sortOrder);
});
</script>
