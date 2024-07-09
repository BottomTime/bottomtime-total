import { FriendDTO } from '../types';
import { Fetcher } from './fetcher';

export class Friend {
  constructor(
    private readonly client: Fetcher,
    private readonly ownerUsername: string,
    private readonly data: FriendDTO,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get friendsSince(): Date {
    return this.data.friendsSince;
  }

  get avatar(): string | undefined {
    return this.data.avatar ?? undefined;
  }

  get location(): string | undefined {
    return this.data.location ?? undefined;
  }

  get name(): string | undefined {
    return this.data.name ?? undefined;
  }

  get memberSince(): Date {
    return this.data.memberSince;
  }

  get logBookSharing(): string {
    return this.data.logBookSharing;
  }

  get username(): string {
    return this.data.username;
  }

  async unfriend(): Promise<void> {
    await this.client.delete(
      `/api/users/${this.ownerUsername}/friends/${this.username}`,
    );
  }

  toJSON(): FriendDTO {
    return { ...this.data };
  }
}
