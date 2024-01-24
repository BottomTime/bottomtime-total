import { UserDTO } from '@bottomtime/api';

export class UserProfile {
  constructor(private readonly data: UserDTO['profile']) {}

  get name(): string | undefined {
    return this.data.name;
  }
  set name(value: string | undefined) {
    this.data.name = value;
  }
}
