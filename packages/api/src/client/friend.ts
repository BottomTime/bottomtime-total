import { AxiosInstance } from 'axios';

import { FriendDTO } from '../types';

export class Friend {
  constructor(
    private readonly client: AxiosInstance,
    private readonly data: FriendDTO,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get username(): string {
    return this.data.username;
  }

  toJSON(): FriendDTO {
    return { ...this.data };
  }
}
