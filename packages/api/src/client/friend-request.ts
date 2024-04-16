import { AxiosInstance } from 'axios';

import { FriendRequestDTO } from '../types';

export class FriendRequest {
  constructor(
    private readonly client: AxiosInstance,
    private readonly data: FriendRequestDTO,
  ) {}

  toJSON(): FriendRequestDTO {
    return { ...this.data };
  }
}
