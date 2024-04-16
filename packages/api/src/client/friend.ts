import { AxiosInstance } from 'axios';

import { FriendDTO } from '../types';

export class Friend {
  constructor(
    private readonly client: AxiosInstance,
    private readonly data: FriendDTO,
  ) {}

  toJSON(): FriendDTO {
    return { ...this.data };
  }
}
