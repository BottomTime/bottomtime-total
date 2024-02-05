import { UserDTO } from '@bottomtime/api';

export class UserProfile {
  constructor(private readonly data: UserDTO['profile']) {}

  get avatar(): string | undefined {
    return this.data.avatar;
  }
  set avatar(value: string | undefined) {
    this.data.avatar = value;
  }

  get name(): string | undefined {
    return this.data.name;
  }
  set name(value: string | undefined) {
    this.data.name = value;
  }

  get location(): string | undefined {
    return this.data.location;
  }
  set location(value: string | undefined) {
    this.data.location = value;
  }
}
