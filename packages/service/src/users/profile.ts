import {
  LogBookSharing,
  ProfileDTO,
  SuccinctProfileDTO,
  UpdateProfileParamsDTO,
} from '@bottomtime/api';

import { Repository } from 'typeorm';

import { UserEntity } from '../data';

export type UpdateProfileOptions = UpdateProfileParamsDTO;

export class Profile {
  constructor(
    private readonly Users: Repository<UserEntity>,
    private data: UserEntity,
  ) {}

  get avatar(): string | undefined {
    return this.data.avatar ?? undefined;
  }

  get bio(): string | undefined {
    return this.data.bio ?? undefined;
  }

  get customData(): Record<string, unknown> | undefined {
    return this.data.customData ?? undefined;
  }

  get experienceLevel(): string | undefined {
    return this.data.experienceLevel ?? undefined;
  }

  get location(): string | undefined {
    return this.data.location ?? undefined;
  }

  get logBookSharing(): LogBookSharing {
    return this.data.logBookSharing;
  }

  get name(): string | undefined {
    return this.data.name ?? undefined;
  }

  get startedDiving(): string | undefined {
    return this.data.startedDiving ?? undefined;
  }

  async update(params: UpdateProfileOptions): Promise<void> {
    if (params.bio !== undefined) this.data.bio = params.bio ?? null;

    if (params.experienceLevel !== undefined)
      this.data.experienceLevel = params.experienceLevel ?? null;

    if (params.location !== undefined)
      this.data.location = params.location ?? null;

    if (params.logBookSharing !== undefined)
      this.data.logBookSharing = params.logBookSharing;

    if (params.name !== undefined) this.data.name = params.name ?? null;

    if (params.startedDiving !== undefined)
      this.data.startedDiving = params.startedDiving ?? null;

    this.data = await this.Users.save(this.data);
  }

  async setAvatarUrl(avatarUrl: string | null): Promise<void> {
    await this.Users.update({ id: this.data.id }, { avatar: avatarUrl });
    this.data.avatar = avatarUrl;
  }

  toJSON(): ProfileDTO {
    return {
      accountTier: this.data.accountTier,
      avatar: this.avatar ?? undefined,
      bio: this.bio ?? undefined,
      experienceLevel: this.experienceLevel ?? undefined,
      location: this.location ?? undefined,
      logBookSharing: this.logBookSharing,
      memberSince: this.data.memberSince,
      name: this.name ?? undefined,
      startedDiving: this.startedDiving ?? undefined,
      userId: this.data.id,
      username: this.data.username,
    };
  }

  toSuccinctJSON(): SuccinctProfileDTO {
    return {
      accountTier: this.data.accountTier,
      avatar: this.avatar ?? undefined,
      logBookSharing: this.logBookSharing,
      memberSince: this.data.memberSince,
      name: this.name ?? undefined,
      userId: this.data.id,
      username: this.data.username,
    };
  }
}
