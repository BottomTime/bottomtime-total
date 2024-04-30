import { AxiosInstance } from 'axios';

import {
  ListAvatarURLsResponseDTO,
  LogBookSharing,
  ProfileDTO,
  SetProfileAvatarParamsDTO,
  UpdateProfileParamsSchema,
} from '../types';

export class UserProfile {
  constructor(
    private readonly client: AxiosInstance,
    private readonly data: ProfileDTO,
  ) {}

  get avatar(): string | undefined {
    return this.data.avatar || undefined;
  }

  get bio(): string | undefined {
    return this.data.bio || undefined;
  }
  set bio(value: string | undefined) {
    this.data.bio = value;
  }

  get experienceLevel(): string | undefined {
    return this.data.experienceLevel || undefined;
  }
  set experienceLevel(value: string | undefined) {
    this.data.experienceLevel = value;
  }

  get location(): string | undefined {
    return this.data.location ?? undefined;
  }
  set location(value: string | undefined) {
    this.data.location = value;
  }

  get logBookSharing(): LogBookSharing {
    return this.data.logBookSharing ?? LogBookSharing.Private;
  }
  set logBookSharing(value: LogBookSharing) {
    this.data.logBookSharing = value;
  }

  get name(): string | undefined {
    return this.data.name || undefined;
  }
  set name(value: string | undefined) {
    this.data.name = value;
  }

  get startedDiving(): string | undefined {
    return this.data.startedDiving || undefined;
  }
  set startedDiving(value: string | undefined) {
    this.data.startedDiving = value;
  }

  async save(): Promise<void> {
    const params = UpdateProfileParamsSchema.parse(this.data);
    await this.client.put(`/api/users/${this.data.username}`, params);
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
