import { AxiosInstance, isAxiosError } from 'axios';

import {
  FriendRequestSchema,
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
        (friend) => new Friend(this.apiClient, username, friend),
      ),
      totalCount: result.totalCount,
    };
  }

  async areFriends(username: string, friendUsername: string): Promise<boolean> {
    try {
      await this.apiClient.head(
        `/api/users/${username}/friends/${friendUsername}`,
      );
      return true;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return false;
      }

      throw error;
    }
  }

  async getFriend(username: string, friendUsername: string): Promise<Friend> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}/friends/${friendUsername}`,
    );
    return new Friend(this.apiClient, username, FriendSchema.parse(data));
  }

  /** @deprecated Use the Friend.unfriend() method instead. Will remove this at some point. */
  async unfriend(username: string, friendUsername: string): Promise<void> {
    await this.apiClient.delete(
      `/api/users/${username}/friends/${friendUsername}`,
    );
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
        (request) => new FriendRequest(this.apiClient, username, request),
      ),
      totalCount: result.totalCount,
    };
  }

  async createFriendRequest(
    username: string,
    friendUsername: string,
  ): Promise<FriendRequest> {
    const { data } = await this.apiClient.put(
      `/api/users/${username}/friendRequests/${friendUsername}`,
    );

    return new FriendRequest(
      this.apiClient,
      username,
      FriendRequestSchema.parse(data),
    );
  }

  wrapFriendDTO(username: string, data: unknown): Friend {
    const dto = FriendSchema.parse(data);
    return new Friend(this.apiClient, username, dto);
  }

  wrapFriendRequestDTO(username: string, data: unknown): FriendRequest {
    const dto = FriendRequestSchema.parse(data);
    return new FriendRequest(this.apiClient, username, dto);
  }
}
