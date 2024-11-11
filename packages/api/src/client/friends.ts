import {
  ApiList,
  FriendRequestSchema,
  FriendSchema,
  ListFriendRequestsParamsDTO,
  ListFriendRequestsResponseSchema,
  ListFriendsParamsDTO,
  ListFriendsResposneSchema,
} from '../types';
import { Fetcher } from './fetcher';
import { Friend } from './friend';
import { FriendRequest } from './friend-request';

export class FriendsApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async listFriends(
    username: string,
    params?: ListFriendsParamsDTO,
  ): Promise<ApiList<Friend>> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}/friends`,
      params,
    );
    const result = ListFriendsResposneSchema.parse(data);

    return {
      data: result.data.map(
        (friend) => new Friend(this.apiClient, username, friend),
      ),
      totalCount: result.totalCount,
    };
  }

  async areFriends(username: string, friendUsername: string): Promise<boolean> {
    const status = await this.apiClient.head(
      `/api/users/${username}/friends/${friendUsername}`,
    );
    return status === 200;
  }

  async getFriend(username: string, friendUsername: string): Promise<Friend> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}/friends/${friendUsername}`,
      undefined,
      FriendSchema,
    );
    return new Friend(this.apiClient, username, data);
  }

  async listFriendRequests(
    username: string,
    params?: ListFriendRequestsParamsDTO,
  ): Promise<ApiList<FriendRequest>> {
    const { data: result } = await this.apiClient.get(
      `/api/users/${username}/friendRequests`,
      params,
      ListFriendRequestsResponseSchema,
    );

    return {
      data: result.data.map(
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
      undefined,
      FriendRequestSchema,
    );

    return new FriendRequest(this.apiClient, username, data);
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
