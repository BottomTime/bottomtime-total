import { UpdateProfileParamsSchema, UserDTO } from '@bottomtime/api';

import { AxiosInstance } from 'axios';

export class UserProfile {
  constructor(
    private readonly client: AxiosInstance,
    private readonly data: UserDTO,
  ) {}

  get avatar(): string | undefined {
    return this.data.profile.avatar;
  }
  set avatar(value: string | undefined) {
    this.data.profile.avatar = value;
  }

  get bio(): string | undefined {
    return this.data.profile.bio;
  }
  set bio(value: string | undefined) {
    this.data.profile.bio = value;
  }

  get birthdate(): string | undefined {
    return this.data.profile.birthdate;
  }
  set birthdate(value: string | undefined) {
    this.data.profile.birthdate = value;
  }

  get experienceLevel(): string | undefined {
    return this.data.profile.experienceLevel;
  }
  set experienceLevel(value: string | undefined) {
    this.data.profile.experienceLevel = value;
  }

  get location(): string | undefined {
    return this.data.profile.location;
  }
  set location(value: string | undefined) {
    this.data.profile.location = value;
  }

  get name(): string | undefined {
    return this.data.profile.name;
  }
  set name(value: string | undefined) {
    this.data.profile.name = value;
  }

  get startedDiving(): string | undefined {
    return this.data.profile.startedDiving;
  }
  set startedDiving(value: string | undefined) {
    this.data.profile.startedDiving = value;
  }

  async save(): Promise<void> {
    const params = UpdateProfileParamsSchema.parse(this.data.profile);
    await this.client.put(`/api/users/${this.data.username}`, params);
  }
}
