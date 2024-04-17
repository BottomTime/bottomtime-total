<template>
  <div class="flex flex-col space-y-3 grow w-full">
    <FormBox class="flex justify-between items-center">
      <p>
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

    <ul class="">
      <FriendsListItem
        v-for="friend in friends.friends"
        :key="friend.id"
        :friend="friend"
        @select="(friend) => $emit('select-friend', friend)"
        @unfriend="(friend) => $emit('unfriend', friend)"
      />
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {
  FriendDTO,
  FriendsSortBy,
  ListFriendsResponseDTO,
  SortOrder,
} from '@bottomtime/api';

import { ref } from 'vue';

import { SelectOption } from '../../common';
import FormBox from '../common/form-box.vue';
import FormButton from '../common/form-button.vue';
import FormSelect from '../common/form-select.vue';
import FriendsListItem from './friends-list-item.vue';

interface FriendsListProps {
  friends: ListFriendsResponseDTO;
  sortBy?: FriendsSortBy;
  sortOrder?: SortOrder;
}

const SortOrderOptions: SelectOption[] = [
  {
    label: 'Username',
    value: `${FriendsSortBy.Username}-${SortOrder.Ascending}`,
  },
  {
    label: 'Friends (recent to oldest)',
    value: `${FriendsSortBy.FriendsSince}-${SortOrder.Descending}`,
  },
  {
    label: 'Friends (oldest to recent)',
    value: `${FriendsSortBy.FriendsSince}-${SortOrder.Ascending}`,
  },
];

const props = withDefaults(defineProps<FriendsListProps>(), {
  sortBy: FriendsSortBy.FriendsSince,
  sortOrder: SortOrder.Descending,
});
defineEmits<{
  (e: 'add-friend'): void;
  (e: 'select-friend', friend: FriendDTO): void;
  (e: 'unfriend', friend: FriendDTO): void;
}>();

const sortOrderString = ref(`${props.sortBy}-${props.sortOrder}`);
</script>
