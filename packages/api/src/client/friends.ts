import { AxiosInstance } from 'axios';

import {
  FriendSchema,
  ListFriendRequestsParams,
  ListFriendRequestsResponseSchema,
  ListFriendsParams,
  ListFriendsResposneSchema,
} from '../types';
import { Friend } from './friend';
import { FriendRequest } from './friend-request';

export type ListFriendsResults = {
  friends: Friend[];
  totalCount: number;
};

export type ListFriendRequestsResults = {
  friendRequests: FriendRequest[];
  totalCount: number;
};

export class FriendsApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  async listFriends(
    username: string,
    params?: ListFriendsParams,
  ): Promise<ListFriendsResults> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}/friends`,
      { params },
    );
    const result = ListFriendsResposneSchema.parse(data);

    return {
      friends: result.friends.map(
        (friend) => new Friend(this.apiClient, friend),
      ),
      totalCount: result.totalCount,
    };
  }

  async listFriendRequests(
    username: string,
    params?: ListFriendRequestsParams,
  ): Promise<ListFriendRequestsResults> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}/friendRequests`,
      { params },
    );
    const result = ListFriendRequestsResponseSchema.parse(data);

    return {
      friendRequests: result.friendRequests.map(
        (request) => new FriendRequest(this.apiClient, request),
      ),
      totalCount: result.totalCount,
    };
  }

  wrapFriendDTO(data: unknown): Friend {
    const dto = FriendSchema.parse(data);
    return new Friend(this.apiClient, dto);
  }
}
