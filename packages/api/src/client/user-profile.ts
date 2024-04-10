import { AxiosInstance } from 'axios';
import { URL } from 'url';

import {
  AvatarSize,
  ListAvatarURLsResponseDTO,
  SetProfileAvatarParamsDTO,
  UpdateProfileParamsSchema,
  UserDTO,
} from '../types';

export class UserProfile {
  constructor(
    private readonly client: AxiosInstance,
    private readonly data: UserDTO,
  ) {}

  get bio(): string | undefined {
    return this.data.profile.bio ?? undefined;
  }
  set bio(value: string | undefined) {
    this.data.profile.bio = value;
  }

  get birthdate(): string | undefined {
    return this.data.profile.birthdate ?? undefined;
  }
  set birthdate(value: string | undefined) {
    this.data.profile.birthdate = value;
  }

  get experienceLevel(): string | undefined {
    return this.data.profile.experienceLevel ?? undefined;
  }
  set experienceLevel(value: string | undefined) {
    this.data.profile.experienceLevel = value;
  }

  get location(): string | undefined {
    return this.data.profile.location ?? undefined;
  }
  set location(value: string | undefined) {
    this.data.profile.location = value;
  }

  get name(): string | undefined {
    return this.data.profile.name ?? undefined;
  }
  set name(value: string | undefined) {
    this.data.profile.name = value;
  }

  get startedDiving(): string | undefined {
    return this.data.profile.startedDiving ?? undefined;
  }
  set startedDiving(value: string | undefined) {
    this.data.profile.startedDiving = value;
  }

  async save(): Promise<void> {
    const params = UpdateProfileParamsSchema.parse(this.data.profile);
    await this.client.put(`/api/users/${this.data.username}`, params);
  }

  getAvatar(size: AvatarSize): string | undefined {
    if (!this.data.profile.avatar) return undefined;

    return this.data.profile.avatar.endsWith('/')
      ? new URL(size, this.data.profile.avatar).toString()
      : new URL(size, `${this.data.profile.avatar}/`).toString();
  }

  async uploadAvatar(
    avatar: File,
    region?: SetProfileAvatarParamsDTO,
  ): Promise<ListAvatarURLsResponseDTO> {
    const formData = new FormData();
    formData.append('avatar', avatar);

    if (region && 'left' in region) {
      formData.append('left', region.left.toString());
      formData.append('top', region.top.toString());
      formData.append('width', region.width.toString());
      formData.append('height', region.height.toString());
    }

    const { data } = await this.client.post<ListAvatarURLsResponseDTO>(
      `/api/users/${this.data.username}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return data;
  }

  async deleteAvatar(): Promise<void> {
    await this.client.delete(`/api/users/${this.data.username}/avatar`);
  }
}
