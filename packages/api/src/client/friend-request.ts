import { FriendRequestDTO, FriendRequestDirection } from '../types';
import { Fetcher } from './fetcher';

export class FriendRequest {
  constructor(
    private readonly client: Fetcher,
    private readonly username: string,
    private readonly data: FriendRequestDTO,
  ) {}

  private getRequestCancelPath(): string {
    return this.data.direction === FriendRequestDirection.Outgoing
      ? `/api/users/${this.username}/friendRequests/${this.data.friend.username}`
      : `/api/users/${this.data.friend.username}/friendRequests/${this.username}`;
  }

  private getRequestAcknowledgePath(): string {
    return this.data.direction === FriendRequestDirection.Incoming
      ? `/api/users/${this.username}/friendRequests/${this.data.friend.username}/acknowledge`
      : `/api/users/${this.data.friend.username}/friendRequests/${this.username}/acknowledge`;
  }

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
    await this.client.delete(this.getRequestCancelPath());
  }

  async accept(): Promise<void> {
    await this.client.post(this.getRequestAcknowledgePath(), {
      accepted: true,
    });
    this.data.accepted = true;
    this.data.reason = undefined;
  }

  async decline(reason?: string): Promise<void> {
    await this.client.post(this.getRequestAcknowledgePath(), {
      accepted: false,
      reason,
    });
    this.data.accepted = false;
    this.data.reason = reason;
  }

  toJSON(): FriendRequestDTO {
    return { ...this.data };
  }
}
