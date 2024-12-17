import {
  ApiList,
  FriendDTO,
  FriendRequestDTO,
  FriendRequestDirection,
  FriendRequestSchema,
  FriendSchema,
  ListFriendRequestsParamsDTO,
  ListFriendRequestsResponseSchema,
  ListFriendsParamsDTO,
  ListFriendsResposneSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class FriendsApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  private getRequestCancelPath(
    username: string,
    request: FriendRequestDTO,
  ): string {
    return request.direction === FriendRequestDirection.Outgoing
      ? `/api/users/${username}/friendRequests/${request.friend.username}`
      : `/api/users/${request.friend.username}/friendRequests/${username}`;
  }

  private getRequestAcknowledgePath(
    username: string,
    request: FriendRequestDTO,
  ): string {
    return request.direction === FriendRequestDirection.Incoming
      ? `/api/users/${username}/friendRequests/${request.friend.username}/acknowledge`
      : `/api/users/${request.friend.username}/friendRequests/${username}/acknowledge`;
  }

  async listFriends(
    username: string,
    params?: ListFriendsParamsDTO,
  ): Promise<ApiList<FriendDTO>> {
    const { data: results } = await this.apiClient.get(
      `/api/users/${username}/friends`,
      params,
      ListFriendsResposneSchema,
    );
    return results;
  }

  async areFriends(username: string, friendUsername: string): Promise<boolean> {
    const status = await this.apiClient.head(
      `/api/users/${username}/friends/${friendUsername}`,
    );
    return status === 200;
  }

  async getFriend(
    username: string,
    friendUsername: string,
  ): Promise<FriendDTO> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}/friends/${friendUsername}`,
      undefined,
      FriendSchema,
    );
    return data;
  }

  async unfriend(username: string, friendUsername: string): Promise<void> {
    await this.apiClient.delete(
      `/api/users/${username}/friends/${friendUsername}`,
    );
  }

  async listFriendRequests(
    username: string,
    params?: ListFriendRequestsParamsDTO,
  ): Promise<ApiList<FriendRequestDTO>> {
    const { data: results } = await this.apiClient.get(
      `/api/users/${username}/friendRequests`,
      params,
      ListFriendRequestsResponseSchema,
    );
    return results;
  }

  async createFriendRequest(
    username: string,
    friendUsername: string,
  ): Promise<FriendRequestDTO> {
    const { data } = await this.apiClient.put(
      `/api/users/${username}/friendRequests/${friendUsername}`,
      undefined,
      FriendRequestSchema,
    );
    return data;
  }

  async cancelFriendRequest(
    username: string,
    request: FriendRequestDTO,
  ): Promise<void> {
    await this.apiClient.delete(this.getRequestCancelPath(username, request));
  }

  async acceptFriendRequest(
    username: string,
    request: FriendRequestDTO,
  ): Promise<FriendRequestDTO> {
    await this.apiClient.post(
      this.getRequestAcknowledgePath(username, request),
      {
        accepted: true,
      },
    );

    return {
      ...request,
      accepted: true,
      reason: undefined,
    };
  }

  async declineFriendRequest(
    username: string,
    request: FriendRequestDTO,
    reason?: string,
  ): Promise<FriendRequestDTO> {
    await this.apiClient.post(
      this.getRequestAcknowledgePath(username, request),
      {
        accepted: false,
        reason,
      },
    );

    return {
      ...request,
      accepted: false,
      reason,
    };
  }
}
