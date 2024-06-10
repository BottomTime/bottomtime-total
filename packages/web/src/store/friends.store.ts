import {
  FriendDTO,
  FriendRequestDTO,
  ListFriendRequestsResponseDTO,
  ListFriendsResponseDTO,
} from '@bottomtime/api';

import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useFriends = defineStore('friends', () => {
  const currentFriend = ref<FriendDTO | null>(null);
  const friends = reactive<ListFriendsResponseDTO>({
    friends: [],
    totalCount: 0,
  });

  const currentRequest = ref<FriendRequestDTO | null>(null);
  const requests = reactive<ListFriendRequestsResponseDTO>({
    friendRequests: [],
    totalCount: 0,
  });

  return { currentFriend, currentRequest, friends, requests };
});
