import { AxiosInstance } from 'axios';

import { FriendRequestDTO, FriendRequestDirection } from '../types';

export class FriendRequest {
  constructor(
    private readonly client: AxiosInstance,
    private readonly username: string,
    private readonly data: FriendRequestDTO,
  ) {}

  get friend(): FriendRequestDTO['friend'] {
    return this.data.friend;
  }

  get direction(): FriendRequestDirection {
    return this.data.direction;
  }

  get created(): Date {
    return this.data.created;
  }

  get expires(): Date {
    return this.data.expires;
  }

  get accepted(): boolean | undefined {
    return this.data.accepted;
  }

  get declineReason(): string | undefined {
    return this.data.reason;
  }

  async cancel(): Promise<void> {
    await this.client.delete(
      `/api/users/${this.username}/friendRequests/${this.data.friend.username}`,
    );
  }

  async accept(): Promise<void> {
    await this.client.post(
      `/api/users/${this.username}/friendRequests/${this.data.friend.username}/acknowledge`,
      { accepted: true },
    );
  }

  async decline(reason?: string): Promise<void> {
    await this.client.post(
      `/api/users/${this.username}/friendRequests/${this.data.friend.username}/acknowledge`,
      { accepted: false, reason },
    );
  }

  toJSON(): FriendRequestDTO {
    return { ...this.data };
  }
}
